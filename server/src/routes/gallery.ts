import { Elysia, t } from 'elysia';
import { getGalleryItems, saveGalleryItems, type GalleryItem } from '../utils/gallery';

export const galleryRoute = new Elysia({ prefix: '/gallery' })
  // Public: list all gallery documentation items
  .get('/', async ({ query }) => {
    const { category } = query as { category?: string };
    const items = await getGalleryItems();
    const filtered =
      category && category !== 'ALL'
        ? items.filter((item) => item.category.toLowerCase() === category.toLowerCase())
        : items;

    return {
      success: true,
      data: filtered,
    };
  })

  // Admin: create new gallery documentation item
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const current = await getGalleryItems();
        const newItem: GalleryItem = {
          id: `gal-${Date.now()}`,
          title: body.title.trim(),
          category: body.category.trim() || 'Dokumentasi Pembuatan',
          eventOrLocation: body.eventOrLocation?.trim() || 'Jakarta',
          capturedDate: body.capturedDate?.trim() || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          image: body.image.trim(),
          description: body.description?.trim() || '',
          aspect: body.aspect || '4 / 5',
          featured: Boolean(body.featured),
          createdAt: new Date().toISOString(),
        };

        const updated = [newItem, ...current];
        await saveGalleryItems(updated);

        return {
          success: true,
          message: 'Foto dokumentasi berhasil ditambahkan ke galeri.',
          data: newItem,
        };
      } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message || 'Gagal menambah foto galeri.' };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        category: t.String(),
        eventOrLocation: t.Optional(t.String()),
        capturedDate: t.Optional(t.String()),
        image: t.String(),
        description: t.Optional(t.String()),
        aspect: t.Optional(t.String()),
        featured: t.Optional(t.Boolean()),
      }),
    }
  )

  // Admin: update existing gallery item
  .put(
    '/:id',
    async ({ params: { id }, body, set }) => {
      try {
        const current = await getGalleryItems();
        const idx = current.findIndex((item) => item.id === id);

        if (idx === -1) {
          set.status = 404;
          return { success: false, message: 'Item galeri tidak ditemukan.' };
        }

        const updatedItem: GalleryItem = {
          ...current[idx],
          title: body.title.trim(),
          category: body.category.trim(),
          eventOrLocation: body.eventOrLocation?.trim() || '',
          capturedDate: body.capturedDate?.trim() || '',
          image: body.image.trim(),
          description: body.description?.trim() || '',
          aspect: body.aspect || current[idx].aspect || '4 / 5',
          featured: body.featured !== undefined ? Boolean(body.featured) : current[idx].featured,
        };

        const nextList = [...current];
        nextList[idx] = updatedItem;
        await saveGalleryItems(nextList);

        return {
          success: true,
          message: 'Item galeri berhasil diperbarui.',
          data: updatedItem,
        };
      } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message || 'Gagal memperbarui item galeri.' };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        category: t.String(),
        eventOrLocation: t.Optional(t.String()),
        capturedDate: t.Optional(t.String()),
        image: t.String(),
        description: t.Optional(t.String()),
        aspect: t.Optional(t.String()),
        featured: t.Optional(t.Boolean()),
      }),
    }
  )

  // Admin: delete gallery item
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      const current = await getGalleryItems();
      const filtered = current.filter((item) => item.id !== id);
      if (filtered.length === current.length) {
        set.status = 404;
        return { success: false, message: 'Item galeri tidak ditemukan.' };
      }

      await saveGalleryItems(filtered);
      return {
        success: true,
        message: 'Foto galeri berhasil dihapus.',
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message || 'Gagal menghapus foto galeri.' };
    }
  });
