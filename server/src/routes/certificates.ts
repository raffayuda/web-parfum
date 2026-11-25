import { Elysia } from 'elysia';
import { prisma } from '../db';
import { CertType } from '@prisma/client';
import { generateQrCodeDataUrl } from '../utils/qrcode';

function resolveSiteUrl(request?: Request): string {
  const envUrl = process.env.PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, '');

  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (host) return `${proto}://${host}`;
  }

  return 'http://localhost:4321';
}

async function resolveSafeProductSlug(productSlug?: string | null): Promise<string | null> {
  const cleaned = productSlug?.trim();
  if (!cleaned) return null;
  const fragrance = await prisma.fragrance.findUnique({
    where: { slug: cleaned },
    select: { slug: true },
  });
  return fragrance ? fragrance.slug : null;
}

export const certificatesRoute = new Elysia({ prefix: '/certificates' })
  // List all certificates
  .get('/', async ({ query, request }) => {
    const { type } = query as { type?: CertType };
    const where: any = {};
    if (type) where.certType = type;

    const certs = await prisma.certification.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      include: {
        fragrance: {
          select: { name: true, edition: true, slug: true, bottleImage: true },
        },
      },
    });

    const siteUrl = resolveSiteUrl(request);
    const enriched = await Promise.all(
      certs.map(async (c) => {
        const verifyUrl = `${siteUrl}/verify/${c.verifyCode}`;
        const qrCodeUrl = await generateQrCodeDataUrl(verifyUrl);
        return {
          ...c,
          verifyUrl,
          qrCodeUrl,
        };
      })
    );

    return { success: true, data: enriched };
  })

  // Public verification endpoint (Target for Google Lens & phone camera QR code scans)
  .get('/verify/:verifyCode', async ({ params: { verifyCode }, request, set }) => {
    const cert = await prisma.certification.findUnique({
      where: { verifyCode },
      include: {
        fragrance: true,
      },
    });

    if (!cert) {
      set.status = 404;
      return {
        success: false,
        message: 'Data sertifikasi legalitas tidak ditemukan atau kode verifikasi tidak valid.',
      };
    }

    const siteUrl = resolveSiteUrl(request);
    const verifyUrl = `${siteUrl}/verify/${cert.verifyCode}`;
    const qrCodeUrl = await generateQrCodeDataUrl(verifyUrl);

    return {
      success: true,
      data: {
        ...cert,
        verifyUrl,
        qrCodeUrl,
        isLegallyValid: new Date(cert.validUntil) > new Date(),
        scannedTimestamp: new Date().toISOString(),
      },
    };
  })

  // Create new certification (Admin)
  .post('/', async ({ body, request, set }) => {
    try {
      const data = body as any;
      const verifyCode = String(data.verifyCode || '').trim();
      if (!verifyCode || !data.certNumber?.trim() || !data.productName?.trim()) {
        set.status = 400;
        return { success: false, message: 'Nomor sertifikat, nama produk, dan kode verifikasi wajib diisi.' };
      }

      const siteUrl = resolveSiteUrl(request);
      const verifyUrl = `${siteUrl}/verify/${verifyCode}`;
      const qrCodeUrl = await generateQrCodeDataUrl(verifyUrl);
      const safeProductSlug = await resolveSafeProductSlug(data.productSlug);

      const created = await prisma.certification.create({
        data: {
          certType: (data.certType || 'BPOM') as CertType,
          certNumber: String(data.certNumber).trim(),
          productSlug: safeProductSlug,
          productName: String(data.productName).trim(),
          authority:
            String(data.authority || '').trim() ||
            (data.certType === 'HALAL'
              ? 'BPJPH Kementerian Agama RI'
              : 'Badan Pengawas Obat dan Makanan RI'),
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          validUntil: data.validUntil
            ? new Date(data.validUntil)
            : new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
          verifyCode,
          qrCodeUrl,
          status: data.status || 'VERIFIED',
          details: data.details || {},
        },
      });

      return {
        success: true,
        message: 'Sertifikasi berhasil didaftarkan.',
        data: { ...created, verifyUrl },
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Update certification (Admin)
  .put('/:id', async ({ params: { id }, body, request, set }) => {
    try {
      const data = body as any;
      const verifyCode = String(data.verifyCode || '').trim();
      const siteUrl = resolveSiteUrl(request);
      const verifyUrl = `${siteUrl}/verify/${verifyCode}`;
      const qrCodeUrl = await generateQrCodeDataUrl(verifyUrl);
      const safeProductSlug = await resolveSafeProductSlug(data.productSlug);

      const updated = await prisma.certification.update({
        where: { id },
        data: {
          certType: (data.certType || 'BPOM') as CertType,
          certNumber: String(data.certNumber).trim(),
          productSlug: safeProductSlug,
          productName: String(data.productName).trim(),
          authority: String(data.authority).trim(),
          issueDate: new Date(data.issueDate),
          validUntil: new Date(data.validUntil),
          verifyCode,
          qrCodeUrl,
          status: data.status || 'VERIFIED',
          details: data.details || {},
        },
      });

      return {
        success: true,
        message: 'Sertifikasi berhasil diperbarui.',
        data: { ...updated, verifyUrl },
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Delete certificate (Admin)
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      await prisma.certification.delete({ where: { id } });
      return { success: true, message: 'Sertifikasi berhasil dihapus.' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
