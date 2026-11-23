import { Elysia, t } from 'elysia';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export const uploadRoute = new Elysia({ prefix: '/upload' })
  .post('/', async ({ body, set }) => {
    try {
      const { file, category = 'receipts' } = body as { file: File; category?: string };

      if (!file) {
        set.status = 400;
        return { success: false, message: 'File wajib disertakan.' };
      }

      // Safe upload directory
      const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');
      const uploadsDir = join(process.cwd(), 'uploads', safeCategory);
      await mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'png';
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = join(uploadsDir, filename);

      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));

      const publicUrl = `/uploads/${safeCategory}/${filename}`;

      return {
        success: true,
        message: 'File berhasil diunggah.',
        url: publicUrl,
        filename,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      file: t.File(),
      category: t.Optional(t.String()),
    }),
  });
