import { Elysia, t } from 'elysia';
import { prisma } from '../db';
import { CertType } from '@prisma/client';
import { generateQrCodeDataUrl } from '../utils/qrcode';

export const certificatesRoute = new Elysia({ prefix: '/certificates' })
  // List all certificates
  .get('/', async ({ query }) => {
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

    // Ensure all have a qrCodeUrl generated
    const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    const enriched = await Promise.all(
      certs.map(async (c) => {
        const verifyUrl = `${siteUrl}/verify/${c.verifyCode}`;
        const qrCodeUrl = c.qrCodeUrl || (await generateQrCodeDataUrl(verifyUrl));
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
  .get('/verify/:verifyCode', async ({ params: { verifyCode }, set }) => {
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

    const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
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
  .post('/', async ({ body, set }) => {
    try {
      const data = body as any;
      const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      const verifyUrl = `${siteUrl}/verify/${data.verifyCode}`;
      const qrCodeUrl = await generateQrCodeDataUrl(verifyUrl);

      const created = await prisma.certification.create({
        data: {
          certType: data.certType as CertType,
          certNumber: data.certNumber,
          productSlug: data.productSlug || null,
          productName: data.productName,
          authority: data.authority,
          issueDate: new Date(data.issueDate),
          validUntil: new Date(data.validUntil),
          verifyCode: data.verifyCode,
          qrCodeUrl,
          status: data.status || 'VERIFIED',
          details: data.details || {},
        },
      });

      return {
        success: true,
        message: 'Sertifikasi berhasil didaftarkan.',
        data: created,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Update certification (Admin)
  .put('/:id', async ({ params: { id }, body, set }) => {
    try {
      const data = body as any;
      const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      const verifyUrl = `${siteUrl}/verify/${data.verifyCode}`;
      const qrCodeUrl = await generateQrCodeDataUrl(verifyUrl);

      const updated = await prisma.certification.update({
        where: { id },
        data: {
          certType: data.certType as CertType,
          certNumber: data.certNumber,
          productSlug: data.productSlug,
          productName: data.productName,
          authority: data.authority,
          issueDate: new Date(data.issueDate),
          validUntil: new Date(data.validUntil),
          verifyCode: data.verifyCode,
          qrCodeUrl,
          status: data.status,
          details: data.details,
        },
      });

      return {
        success: true,
        message: 'Sertifikasi berhasil diperbarui.',
        data: updated,
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
