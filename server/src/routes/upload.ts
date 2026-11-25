import { Elysia, t } from 'elysia';
import sharp from 'sharp';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export const uploadRoute = new Elysia({ prefix: '/upload' })
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const { file, category = 'receipts' } = body as { file: File; category?: string };

        if (!file) {
          set.status = 400;
          return { success: false, message: 'File wajib disertakan.' };
        }

        if (!file.type.startsWith('image/')) {
          set.status = 400;
          return {
            success: false,
            message: 'Format file harus berupa gambar (JPG, PNG, atau WEBP).',
          };
        }

        if (file.size > MAX_UPLOAD_BYTES) {
          set.status = 400;
          return {
            success: false,
            message: 'Ukuran file melebihi batas maksimal 2 MB.',
          };
        }

        const inputBuffer = Buffer.from(await file.arrayBuffer());
        const isReceipt = category === 'receipts';
        const maxWidth = isReceipt ? 1200 : 1600;
        const maxHeight = isReceipt ? 1600 : 1600;

        let compressedBuffer = await sharp(inputBuffer)
          .rotate()
          .resize({
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 74, effort: 4 })
          .toBuffer();

        // Extra compression pass if still relatively large
        if (compressedBuffer.length > 220 * 1024) {
          compressedBuffer = await sharp(inputBuffer)
            .rotate()
            .resize({
              width: 1000,
              height: 1400,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: 58, effort: 4 })
            .toBuffer();
        }

        const dataUri = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;

        return {
          success: true,
          message: 'Gambar berhasil dikompres dan diunggah.',
          url: dataUri,
          filename: `${Date.now()}.webp`,
          originalSize: file.size,
          compressedSize: compressedBuffer.length,
        };
      } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message || 'Gagal memproses gambar.' };
      }
    },
    {
      body: t.Object({
        file: t.File(),
        category: t.Optional(t.String()),
      }),
    }
  );
