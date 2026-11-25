/**
 * Send transactional OTP emails via Brevo (v3 SMTP/Email REST API).
 */
export async function sendBrevoOtpEmail(params: {
  toEmail: string;
  toName: string;
  otp: string;
  purpose?: 'register' | 'reset-password';
}): Promise<{ sent: boolean; mode: 'brevo' | 'dev-log' }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@omoo.web.id';
  const senderName = process.env.BREVO_SENDER_NAME || 'OMOO';
  const isReset = params.purpose === 'reset-password';

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Konfigurasi email OTP (BREVO_API_KEY) belum diatur di server.');
    }
    console.info(
      `[DEV OTP:${isReset ? 'RESET' : 'REGISTER'}] Verification code for ${params.toEmail}: ${params.otp}`
    );
    return { sent: true, mode: 'dev-log' };
  }

  const eyebrowText = isReset ? 'Reset Kata Sandi' : 'Verifikasi Pendaftaran Akun';
  const bodyText = isReset
    ? 'Masukkan kode verifikasi 6 digit di bawah ini untuk mengatur ulang kata sandi akun OMOO Anda. Kode berlaku selama 10 menit.'
    : 'Masukkan kode verifikasi 6 digit di bawah ini untuk menyelesaikan pendaftaran akun OMOO Anda. Kode berlaku selama 10 menit.';
  const ignoreText = isReset
    ? 'Jangan bagikan kode ini kepada siapa pun. Jika Anda tidak meminta pengaturan ulang kata sandi di OMOO, abaikan email ini.'
    : 'Jangan bagikan kode ini kepada siapa pun. Jika Anda tidak merasa melakukan pendaftaran di OMOO, abaikan email ini.';
  const emailSubject = isReset
    ? `${params.otp} — Kode Reset Kata Sandi OMOO`
    : `${params.otp} — Kode Verifikasi Akun OMOO`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:32px 16px;background-color:#e9eae3;color:#141710;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background-color:#ffffff;border:1px solid #c4c7b9;">
    <tr>
      <td style="padding:32px 36px;border-bottom:1px solid #c4c7b9;">
        <p style="margin:0;font-size:18px;letter-spacing:0.22em;text-transform:uppercase;font-weight:500;color:#141710;">
          OMOO
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:36px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#5d6356;">
          ${eyebrowText}
        </p>
        <h1 style="margin:0 0 18px;font-size:24px;font-weight:400;color:#141710;">
          Halo, ${escapeHtml(params.toName || 'Pelanggan')}
        </h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5d6356;">
          ${bodyText}
        </p>
        <div style="margin:0 0 24px;padding:18px 24px;background-color:#e9eae3;border:1px solid #c4c7b9;text-align:center;">
          <span style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:0.35em;font-weight:700;color:#141710;">
            ${escapeHtml(params.otp)}
          </span>
        </div>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#5d6356;">
          ${ignoreText}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 36px;border-top:1px solid #c4c7b9;background-color:#f6f6f2;">
        <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5d6356;">
          OMOO Parfums &mdash; Jakarta, Indonesia
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: params.toEmail, name: params.toName || params.toEmail }],
      subject: emailSubject,
      htmlContent,
      textContent: `Halo ${params.toName || ''},\n\n${eyebrowText} — Kode OTP OMOO Anda adalah: ${params.otp}\n\nKode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let message = 'Gagal mengirim email OTP melalui Brevo.';
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.message) message = `Brevo: ${parsed.message}`;
    } catch {}
    throw new Error(message);
  }

  return { sent: true, mode: 'brevo' };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
