import { Elysia, t } from 'elysia';
import { prisma } from '../db';

export const perfumesRoute = new Elysia({ prefix: '/perfumes' })
  // List all perfumes
  .get('/', async ({ query }) => {
    const { family, availableOnly } = query as { family?: string; availableOnly?: string };
    const where: any = {};
    if (family && family !== 'All') {
      where.family = { equals: family, mode: 'insensitive' };
    }
    if (availableOnly === 'true') {
      where.isAvailable = true;
    }

    const perfumes = await prisma.fragrance.findMany({
      where,
      orderBy: { edition: 'asc' },
      include: {
        certifications: true,
      },
    });

    return {
      success: true,
      data: perfumes,
      count: perfumes.length,
    };
  })

  // Get single perfume by slug
  .get('/:slug', async ({ params: { slug }, set }) => {
    const perfume = await prisma.fragrance.findUnique({
      where: { slug },
      include: {
        certifications: true,
      },
    });

    if (!perfume) {
      set.status = 404;
      return { success: false, message: 'Parfum tidak ditemukan' };
    }

    return { success: true, data: perfume };
  })

  // Toggle availability (Admin)
  .patch('/:id/availability', async ({ params: { id }, body, set }) => {
    const { isAvailable } = body as { isAvailable: boolean };
    try {
      const updated = await prisma.fragrance.update({
        where: { id },
        data: { isAvailable },
      });
      return {
        success: true,
        message: `Status parfum diperbarui menjadi ${isAvailable ? 'Tersedia' : 'Habis'}`,
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      isAvailable: t.Boolean(),
    }),
  })

  // Create new perfume (Admin)
  .post('/', async ({ body, set }) => {
    try {
      const data = body as any;
      const created = await prisma.fragrance.create({
        data: {
          slug: data.slug,
          edition: data.edition,
          name: data.name,
          family: data.family,
          tagline: data.tagline,
          description: data.description,
          price: Number(data.price),
          volume: data.volume || '50 ml',
          concentration: data.concentration || 'Extrait de parfum, 20%',
          isAvailable: data.isAvailable ?? true,
          stockCount: Number(data.stockCount || 50),
          bottleImage: data.bottleImage || '/src/assets/images/bottle-vetiver.jpg',
          bottleAlt: data.bottleAlt || `Botol Omoo ${data.name}`,
          macroImage: data.macroImage,
          macroAlt: data.macroAlt,
          notes: data.notes || { top: [], heart: [], base: [] },
          material: data.material || { name: '', origin: '', phrase: '' },
          story: data.story || [],
          quote: data.quote,
          performance: data.performance || { concentration: '20%', maceration: '6 minggu', longevity: '8 jam', sillage: 'Moderate' },
          relatedSlugs: data.relatedSlugs || [],
        },
      });

      return {
        success: true,
        message: 'Parfum berhasil ditambahkan ke katalog',
        data: created,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Update perfume (Admin)
  .put('/:id', async ({ params: { id }, body, set }) => {
    try {
      const data = body as any;
      const updated = await prisma.fragrance.update({
        where: { id },
        data: {
          edition: data.edition,
          name: data.name,
          family: data.family,
          tagline: data.tagline,
          description: data.description,
          price: Number(data.price),
          volume: data.volume,
          concentration: data.concentration,
          isAvailable: data.isAvailable,
          stockCount: Number(data.stockCount),
          bottleImage: data.bottleImage,
          bottleAlt: data.bottleAlt,
          macroImage: data.macroImage,
          macroAlt: data.macroAlt,
          notes: data.notes,
          material: data.material,
          story: data.story,
          quote: data.quote,
          performance: data.performance,
          relatedSlugs: data.relatedSlugs,
        },
      });

      return {
        success: true,
        message: 'Katalog parfum berhasil diperbarui',
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Delete perfume (Admin)
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      await prisma.fragrance.delete({ where: { id } });
      return { success: true, message: 'Parfum berhasil dihapus dari katalog' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
