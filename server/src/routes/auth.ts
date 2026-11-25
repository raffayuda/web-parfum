import { Elysia, t } from 'elysia';
import { randomInt, createHash } from 'crypto';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { auth } from '../auth';
import { prisma } from '../db';
import { sendBrevoOtpEmail } from '../utils/email';
import { syncUserLoyalty } from '../utils/loyalty';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_COOLDOWN_MS = 45 * 1000; // 45 seconds between resends
const OTP_MAX_ATTEMPTS = 5;

function hashOtp(email: string, otp: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || 'omoo-otp-salt';
  return createHash('sha256').update(`${email}:${otp}:${secret}`).digest('hex');
}

async function issueOtpCode(params: {
  identifier: string;
  email: string;
  name: string;
  purpose: 'register' | 'reset-password';
}) {
  const existingOtp = await prisma.verification.findFirst({
    where: { identifier: params.identifier },
    orderBy: { createdAt: 'desc' },
  });

  if (existingOtp && Date.now() - existingOtp.createdAt.getTime() < OTP_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (OTP_COOLDOWN_MS - (Date.now() - existingOtp.createdAt.getTime())) / 1000
    );
    return {
      ok: false as const,
      status: 429,
      message: `Tunggu ${waitSec} detik sebelum meminta kode OTP baru.`,
    };
  }

  const otp = String(randomInt(100000, 1000000));
  const otpHash = hashOtp(params.email, otp);

  await prisma.verification.deleteMany({ where: { identifier: params.identifier } });
  await prisma.verification.create({
    data: {
      identifier: params.identifier,
      value: JSON.stringify({ otpHash, attempts: 0 }),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const delivery = await sendBrevoOtpEmail({
    toEmail: params.email,
    toName: params.name,
    otp,
    purpose: params.purpose,
  });

  return {
    ok: true as const,
    mode: delivery.mode,
    cooldownSeconds: Math.floor(OTP_COOLDOWN_MS / 1000),
  };
}

async function verifyOtpCode(identifier: string, email: string, otp: string) {
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false as const, message: 'Kode OTP tidak ditemukan. Silakan minta kode baru.' };
  }

  if (record.expiresAt < new Date()) {
    await prisma.verification.delete({ where: { id: record.id } }).catch(() => {});
    return { ok: false as const, message: 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode baru.' };
  }

  let payload: { otpHash: string; attempts: number } = { otpHash: '', attempts: 0 };
  try {
    payload = JSON.parse(record.value);
  } catch {}

  if (payload.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.verification.delete({ where: { id: record.id } }).catch(() => {});
    return {
      ok: false as const,
      message: 'Terlalu banyak percobaan salah. Silakan minta kode OTP baru.',
    };
  }

  const expectedHash = hashOtp(email, otp);
  if (expectedHash !== payload.otpHash) {
    await prisma.verification.update({
      where: { id: record.id },
      data: {
        value: JSON.stringify({
          otpHash: payload.otpHash,
          attempts: payload.attempts + 1,
        }),
      },
    });
    return { ok: false as const, message: 'Kode OTP tidak sesuai. Periksa kembali email Anda.' };
  }

  await prisma.verification.deleteMany({ where: { identifier } });
  return { ok: true as const };
}

export const authRoute = new Elysia({ prefix: '/auth' })
  // Current user helper (MUST be defined before /* wildcard handler)
  .get('/me', async ({ request, set }) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return { success: false, user: null, loyalty: null, session: null };
      }

      const loyalty = await syncUserLoyalty(session.user.id);

      const freshUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          memberStatus: true,
          memberTier: true,
          memberSince: true,
        },
      });

      return {
        success: true,
        user: freshUser,
        loyalty,
        session: session.session,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })

  // Update currently logged-in user's profile & password (Admin / User)
  .put(
    '/profile',
    async ({ request, body, set }) => {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session) {
          set.status = 401;
          return { success: false, message: 'Sesi tidak ditemukan. Silakan login ulang.' };
        }

        const name = body.name.trim();
        const normalizedEmail = body.email.trim().toLowerCase();
        const phone = body.phone?.trim() || null;

        if (!name || !normalizedEmail) {
          set.status = 400;
          return { success: false, message: 'Nama dan email wajib diisi.' };
        }

        // Check email collision if changed
        const existingOther = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: session.user.id },
          },
          select: { id: true },
        });

        if (existingOther) {
          set.status = 409;
          return { success: false, message: 'Email tersebut sudah digunakan oleh akun lain.' };
        }

        // Handle optional password update
        const newPassword = body.newPassword?.trim() || '';
        const currentPassword = body.currentPassword?.trim() || '';

        if (newPassword) {
          if (newPassword.length < 6) {
            set.status = 400;
            return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
          }
          if (!currentPassword) {
            set.status = 400;
            return { success: false, message: 'Masukkan kata sandi saat ini untuk konfirmasi.' };
          }

          const credentialAccount = await prisma.account.findFirst({
            where: {
              userId: session.user.id,
              providerId: 'credential',
            },
          });

          if (!credentialAccount?.password) {
            set.status = 400;
            return { success: false, message: 'Akun kredensial tidak ditemukan.' };
          }

          const isValidCurrent = await verifyPassword({
            hash: credentialAccount.password,
            password: currentPassword,
          });

          if (!isValidCurrent) {
            set.status = 400;
            return { success: false, message: 'Kata sandi saat ini tidak sesuai.' };
          }

          const hashedNewPassword = await hashPassword(newPassword);
          await prisma.account.update({
            where: { id: credentialAccount.id },
            data: { password: hashedNewPassword },
          });
        }

        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            name,
            email: normalizedEmail,
            phone,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            memberStatus: true,
            memberTier: true,
            memberSince: true,
          },
        });

        return {
          success: true,
          message: newPassword
            ? 'Profil dan kata sandi berhasil diperbarui.'
            : 'Profil berhasil diperbarui.',
          user: updatedUser,
        };
      } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message || 'Gagal memperbarui profil.' };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        phone: t.Optional(t.String()),
        currentPassword: t.Optional(t.String()),
        newPassword: t.Optional(t.String()),
      }),
    }
  )

  // Step 1: Send 6-digit email OTP via Brevo before completing registration
  .post(
    '/register/send-otp',
    async ({ body, set }) => {
      try {
        const normalizedEmail = body.email.trim().toLowerCase();
        const name = body.name.trim();
        const phone = body.phone.trim();

        if (!name || !phone || !normalizedEmail) {
          set.status = 400;
          return { success: false, message: 'Nama, nomor WhatsApp, dan email wajib diisi.' };
        }
        if (body.password.length < 8) {
          set.status = 400;
          return { success: false, message: 'Password minimal 8 karakter.' };
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (existingUser) {
          set.status = 400;
          return { success: false, message: 'Email sudah terdaftar. Silakan masuk ke akun Anda.' };
        }

        const result = await issueOtpCode({
          identifier: `register-otp:${normalizedEmail}`,
          email: normalizedEmail,
          name,
          purpose: 'register',
        });

        if (!result.ok) {
          set.status = result.status;
          return { success: false, message: result.message };
        }

        return {
          success: true,
          message:
            result.mode === 'brevo'
              ? `Kode OTP 6 digit telah dikirim ke ${normalizedEmail}.`
              : `Mode lokal: kode OTP dicetak di log server (${normalizedEmail}).`,
          cooldownSeconds: result.cooldownSeconds,
        };
      } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message || 'Gagal mengirim kode OTP.' };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        phone: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  // Step 2: Verify OTP & create verified user via Better Auth
  .post(
    '/register/verify-otp',
    async ({ body, request, set }) => {
      try {
        const normalizedEmail = body.email.trim().toLowerCase();
        const otp = body.otp.trim();
        const name = body.name.trim();
        const phone = body.phone.trim();

        const verifiedOtp = await verifyOtpCode(`register-otp:${normalizedEmail}`, normalizedEmail, otp);
        if (!verifiedOtp.ok) {
          set.status = 400;
          return { success: false, message: verifiedOtp.message };
        }

        const signUpResponse = await auth.api.signUpEmail({
          body: {
            email: normalizedEmail,
            password: body.password,
            name,
            phone,
          },
          headers: request.headers,
          asResponse: true,
        });

        if (!signUpResponse.ok) {
          return signUpResponse;
        }

        // Mark emailVerified = true and activate automatic loyalty membership
        const verifiedUser = await prisma.user
          .update({
            where: { email: normalizedEmail },
            data: {
              emailVerified: true,
              memberStatus: 'ACTIVE',
              memberTier: 'Member',
              memberSince: new Date(),
            },
            select: { id: true },
          })
          .catch(() => null);

        if (verifiedUser?.id) {
          await syncUserLoyalty(verifiedUser.id).catch(() => {});
        }

        const signUpText = await signUpResponse.text();
        let signUpJson: any = {};
        try {
          signUpJson = JSON.parse(signUpText);
        } catch {}

        if (signUpJson?.user) {
          signUpJson.user.emailVerified = true;
          signUpJson.user.memberStatus = 'ACTIVE';
          signUpJson.user.memberTier = 'Member';
        }

        const headers = new Headers(signUpResponse.headers);
        headers.set('Content-Type', 'application/json');

        return new Response(JSON.stringify(signUpJson), {
          status: signUpResponse.status,
          headers,
        });
      } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message || 'Gagal memverifikasi OTP.' };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        phone: t.String(),
        email: t.String(),
        password: t.String(),
        otp: t.String(),
      }),
    }
  )

  // Forgot Password Step 1: Send 6-digit OTP via Brevo
  .post(
    '/forgot-password/send-otp',
    async ({ body, set }) => {
      try {
        const normalizedEmail = body.email.trim().toLowerCase();
        if (!normalizedEmail) {
          set.status = 400;
          return { success: false, message: 'Masukkan alamat email akun Anda.' };
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, name: true },
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: 'Email belum terdaftar di sistem OMOO.' };
        }

        const result = await issueOtpCode({
          identifier: `reset-otp:${normalizedEmail}`,
          email: normalizedEmail,
          name: user.name,
          purpose: 'reset-password',
        });

        if (!result.ok) {
          set.status = result.status;
          return { success: false, message: result.message };
        }

        return {
          success: true,
          message:
            result.mode === 'brevo'
              ? `Kode OTP reset kata sandi telah dikirim ke ${normalizedEmail}.`
              : `Mode lokal: kode OTP reset dicetak di log server (${normalizedEmail}).`,
          cooldownSeconds: result.cooldownSeconds,
        };
      } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message || 'Gagal mengirim kode OTP reset.' };
      }
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    }
  )

  // Forgot Password Step 2: Verify OTP & update password
  .post(
    '/forgot-password/reset',
    async ({ body, set }) => {
      try {
        const normalizedEmail = body.email.trim().toLowerCase();
        const otp = body.otp.trim();
        const newPassword = body.newPassword;

        if (!normalizedEmail || !otp) {
          set.status = 400;
          return { success: false, message: 'Email dan kode OTP wajib diisi.' };
        }
        if (newPassword.length < 8) {
          set.status = 400;
          return { success: false, message: 'Kata sandi baru minimal 8 karakter.' };
        }

        const verified = await verifyOtpCode(`reset-otp:${normalizedEmail}`, normalizedEmail, otp);
        if (!verified.ok) {
          set.status = 400;
          return { success: false, message: verified.message };
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: 'Akun tidak ditemukan.' };
        }

        const hashedPassword = await hashPassword(newPassword);
        const credentialAccount = await prisma.account.findFirst({
          where: { userId: user.id, providerId: 'credential' },
          select: { id: true },
        });

        if (credentialAccount) {
          await prisma.account.update({
            where: { id: credentialAccount.id },
            data: { password: hashedPassword },
          });
        } else {
          await prisma.account.create({
            data: {
              userId: user.id,
              accountId: user.id,
              providerId: 'credential',
              password: hashedPassword,
            },
          });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });

        return {
          success: true,
          message: 'Kata sandi berhasil direset. Silakan masuk dengan kata sandi baru Anda.',
        };
      } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message || 'Gagal mereset kata sandi.' };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        otp: t.String(),
        newPassword: t.String(),
      }),
    }
  )

  // Block direct unverified sign-up bypass
  .post('/sign-up/email', ({ set }) => {
    set.status = 403;
    return {
      success: false,
      message: 'Pendaftaran akun wajib melalui verifikasi kode OTP email.',
    };
  })

  // Forward all Better Auth standard requests (/api/auth/sign-in, sign-out, session, etc.)
  .all('/*', async ({ request }) => {
    return auth.handler(request);
  });
