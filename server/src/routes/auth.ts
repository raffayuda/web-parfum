import { Elysia, t } from 'elysia';
import { randomInt, createHash } from 'crypto';
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

        const identifier = `register-otp:${normalizedEmail}`;
        const existingOtp = await prisma.verification.findFirst({
          where: { identifier },
          orderBy: { createdAt: 'desc' },
        });

        if (existingOtp && Date.now() - existingOtp.createdAt.getTime() < OTP_COOLDOWN_MS) {
          const waitSec = Math.ceil(
            (OTP_COOLDOWN_MS - (Date.now() - existingOtp.createdAt.getTime())) / 1000
          );
          set.status = 429;
          return {
            success: false,
            message: `Tunggu ${waitSec} detik sebelum meminta kode OTP baru.`,
          };
        }

        const otp = String(randomInt(100000, 1000000));
        const otpHash = hashOtp(normalizedEmail, otp);

        await prisma.verification.deleteMany({ where: { identifier } });
        await prisma.verification.create({
          data: {
            identifier,
            value: JSON.stringify({ otpHash, attempts: 0 }),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
          },
        });

        const delivery = await sendBrevoOtpEmail({
          toEmail: normalizedEmail,
          toName: name,
          otp,
        });

        return {
          success: true,
          message:
            delivery.mode === 'brevo'
              ? `Kode OTP 6 digit telah dikirim ke ${normalizedEmail}.`
              : `Mode lokal: kode OTP dicetak di log server (${normalizedEmail}).`,
          cooldownSeconds: Math.floor(OTP_COOLDOWN_MS / 1000),
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

        const identifier = `register-otp:${normalizedEmail}`;
        const record = await prisma.verification.findFirst({
          where: { identifier },
          orderBy: { createdAt: 'desc' },
        });

        if (!record) {
          set.status = 400;
          return {
            success: false,
            message: 'Kode OTP tidak ditemukan. Silakan minta kode baru.',
          };
        }

        if (record.expiresAt < new Date()) {
          await prisma.verification.delete({ where: { id: record.id } }).catch(() => {});
          set.status = 400;
          return {
            success: false,
            message: 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode baru.',
          };
        }

        let payload: { otpHash: string; attempts: number } = { otpHash: '', attempts: 0 };
        try {
          payload = JSON.parse(record.value);
        } catch {}

        if (payload.attempts >= OTP_MAX_ATTEMPTS) {
          await prisma.verification.delete({ where: { id: record.id } }).catch(() => {});
          set.status = 400;
          return {
            success: false,
            message: 'Terlalu banyak percobaan salah. Silakan minta kode OTP baru.',
          };
        }

        const expectedHash = hashOtp(normalizedEmail, otp);
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
          set.status = 400;
          return { success: false, message: 'Kode OTP tidak sesuai. Periksa kembali email Anda.' };
        }

        // Valid OTP: clean up verification entry and register user via Better Auth
        await prisma.verification.deleteMany({ where: { identifier } });

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
