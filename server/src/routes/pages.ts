import { Elysia, t } from 'elysia';
import { prisma } from '../db';
import { SectionTemplate } from '@prisma/client';

export const pagesRoute = new Elysia({ prefix: '/pages' })
  // List all pages
  .get('/', async () => {
    const pages = await prisma.page.findMany({
      include: {
        _count: { select: { sections: true } },
      },
      orderBy: { slug: 'asc' },
    });
    return { success: true, data: pages };
  })

  // Get single page with ordered active sections
  .get('/:slug', async ({ params: { slug }, query, set }) => {
    const includeInactive = (query as any)?.all === 'true';
    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        sections: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!page) {
      set.status = 404;
      return { success: false, message: `Halaman '${slug}' tidak ditemukan` };
    }

    return { success: true, data: page };
  })

  // Create page (Admin)
  .post('/', async ({ body, set }) => {
    try {
      const data = body as any;
      const created = await prisma.page.create({
        data: {
          slug: data.slug.toLowerCase().trim().replace(/\s+/g, '-'),
          title: data.title,
          description: data.description,
          isActive: data.isActive ?? true,
        },
      });
      return { success: true, message: 'Halaman berhasil dibuat', data: created };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Update page details (Admin)
  .put('/:id', async ({ params: { id }, body, set }) => {
    try {
      const data = body as any;
      const updated = await prisma.page.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          isActive: data.isActive,
        },
      });
      return { success: true, message: 'Halaman berhasil diperbarui', data: updated };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Add section to a page (Admin)
  .post('/:id/sections', async ({ params: { id: pageId }, body, set }) => {
    try {
      const data = body as any;
      // Get highest order to append
      const maxOrder = await prisma.pageSection.aggregate({
        where: { pageId },
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;

      const created = await prisma.pageSection.create({
        data: {
          pageId,
          name: data.name || 'Seksi Baru',
          template: data.template as SectionTemplate,
          order: nextOrder,
          title: data.title,
          eyebrow: data.eyebrow,
          subtitle: data.subtitle,
          contentData: data.contentData || {},
          isActive: true,
        },
      });

      return {
        success: true,
        message: 'Seksi baru berhasil ditambahkan ke halaman',
        data: created,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Update section (Admin)
  .put('/sections/:sectionId', async ({ params: { sectionId }, body, set }) => {
    try {
      const data = body as any;
      const updated = await prisma.pageSection.update({
        where: { id: sectionId },
        data: {
          name: data.name,
          template: data.template as SectionTemplate,
          title: data.title,
          eyebrow: data.eyebrow,
          subtitle: data.subtitle,
          contentData: data.contentData,
          isActive: data.isActive,
        },
      });
      return {
        success: true,
        message: 'Konten seksi berhasil diperbarui',
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Reorder sections (Admin)
  .patch('/sections/reorder', async ({ body, set }) => {
    try {
      const { items } = body as { items: Array<{ id: string; order: number }> };
      await prisma.$transaction(
        items.map((item) =>
          prisma.pageSection.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );
      return { success: true, message: 'Urutan seksi berhasil diperbarui' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Delete section (Admin)
  .delete('/sections/:sectionId', async ({ params: { sectionId }, set }) => {
    try {
      await prisma.pageSection.delete({ where: { id: sectionId } });
      return { success: true, message: 'Seksi berhasil dihapus' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Sync entire Home page directly from Inline WYSIWYG Editor
  .post('/sync-home', async ({ body, set }) => {
    try {
      const { sections } = body as { sections: Record<string, any> };
      const homePage = await prisma.page.findUnique({
        where: { slug: 'home' },
        include: { sections: true },
      });

      if (!homePage) {
        set.status = 404;
        return { success: false, message: 'Halaman home tidak ditemukan' };
      }

      const updates = [];
      for (const [templateKey, data] of Object.entries(sections)) {
        const sec = homePage.sections.find((s) => s.template === templateKey);
        if (sec && data) {
          const currentContent = (sec.contentData as any) || {};
          const mergedContent = { ...currentContent, ...(data.contentData || {}) };

          updates.push(
            prisma.pageSection.update({
              where: { id: sec.id },
              data: {
                eyebrow: data.eyebrow !== undefined ? data.eyebrow : sec.eyebrow,
                title: data.title !== undefined ? data.title : sec.title,
                subtitle: data.subtitle !== undefined ? data.subtitle : sec.subtitle,
                isActive: data.isActive !== undefined ? data.isActive : sec.isActive,
                contentData: mergedContent,
              },
            })
          );
        }
      }

      await prisma.$transaction(updates);
      return {
        success: true,
        message: 'Semua perubahan visual teks dan foto berhasil disimpan ke database.',
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Sync any page directly from Inline WYSIWYG Editor (home, about, journey, collection, find)
  .post('/sync-page', async ({ body, set }) => {
    try {
      const { slug = 'home', elements = {}, images = {}, sections = {}, timeline, hiddenSections = [] } = body as {
        slug: string;
        elements?: Record<string, string>;
        images?: Record<string, string>;
        sections?: Record<string, any>;
        timeline?: Array<{ id: string; year: string; copy: string }>;
        hiddenSections?: string[];
      };

      // 1. Ensure page exists
      let page = await prisma.page.findUnique({
        where: { slug },
        include: { sections: true },
      });

      if (!page) {
        page = await prisma.page.create({
          data: {
            slug,
            title:
              slug === 'about'
                ? 'About Us'
                : slug === 'journey'
                  ? 'Journey & Atelier Gallery'
                  : slug === 'collection'
                    ? 'The Collection'
                    : slug === 'find'
                      ? 'Find Your Scent'
                      : slug,
            description: `Halaman dinamis ${slug} Atelier OMOO`,
          },
          include: { sections: true },
        });
      }

      // 2. If home page, run structured section updates
      const updates: any[] = [];
      if (slug === 'home' && Object.keys(sections).length > 0) {
        for (const [templateKey, data] of Object.entries(sections)) {
          const sec = page.sections.find((s) => s.template === templateKey);
          if (sec && data) {
            const currentContent = (sec.contentData as any) || {};
            const mergedContent = { ...currentContent, ...(data.contentData || {}) };
            const isSectionActive = hiddenSections.includes(templateKey)
              ? false
              : data.isActive !== undefined
                ? data.isActive
                : sec.isActive;

            updates.push(
              prisma.pageSection.update({
                where: { id: sec.id },
                data: {
                  eyebrow: data.eyebrow !== undefined ? data.eyebrow : sec.eyebrow,
                  title: data.title !== undefined ? data.title : sec.title,
                  subtitle: data.subtitle !== undefined ? data.subtitle : sec.subtitle,
                  isActive: isSectionActive,
                  contentData: mergedContent,
                },
              })
            );
          }
        }
      }

      // 3. Store visual editable fields in page's main section
      let mainSection = page.sections.find((s) => s.name === `${slug}-content` || s.name === 'Visual Content');
      if (!mainSection) {
        mainSection = await prisma.pageSection.create({
          data: {
            pageId: page.id,
            name: `${slug}-content`,
            template: SectionTemplate.RICH_TEXT_MEDIA,
            order: 0,
            contentData: {
              elements,
              images,
              hiddenSections,
              ...(timeline ? { timeline } : {}),
            },
          },
        });
      } else {
        const existingData = (mainSection.contentData as any) || {};
        updates.push(
          prisma.pageSection.update({
            where: { id: mainSection.id },
            data: {
              contentData: {
                ...existingData,
                elements: { ...(existingData.elements || {}), ...elements },
                images: { ...(existingData.images || {}), ...images },
                hiddenSections: hiddenSections !== undefined ? hiddenSections : (existingData.hiddenSections || []),
                ...(timeline ? { timeline } : {}),
              },
            },
          })
        );
      }

      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }

      return {
        success: true,
        message: `Semua perubahan visual teks dan foto halaman '${slug}' berhasil disimpan ke database.`,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
