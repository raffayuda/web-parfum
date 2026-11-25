import { Elysia, t } from 'elysia';
import { prisma } from '../db';
import { SectionTemplate } from '@prisma/client';

export const defaultSettings = {
  brandName: 'OMOO',
  tagline: 'Haute Parfumerie Jakarta — Grasse',
  phone: '+62 21 555 0192',
  whatsappNumber: '6281200000000',
  whatsappDisplay: '+62 812 0000 0000',
  email: 'hello@omoo.studio',
  street: 'Jl. Senopati No. 42, Kebayoran Baru',
  city: 'Jakarta Selatan 12190',
  country: 'Indonesia',
  hours: 'Senin - Sabtu: 10:00 - 20:00 WIB | Minggu: Janji Temu',
  visitNote: 'Kunjungan dengan janji temu',
  instagramHandle: '@omoo.parfums',
  instagramUrl: 'https://www.instagram.com/omoo.parfums/',
  tiktokHandle: '@omoo.parfums',
  tiktokUrl: 'https://www.tiktok.com/@omoo.parfums',
  pinterestHandle: 'omoo parfums',
  pinterestUrl: 'https://www.pinterest.com/omoo.parfums/',
  footerHeadline: 'Perfume made in small batches.\nDiracik perlahan di Jakarta, dari material pilihan.',
  footerEmailNote: 'Kami membalas dalam 1-2 hari kerja.',
  footerSocialHeading: 'Kabar terbaru dan catatan aroma OMOO.',
  copyright: '© 2026 Omoo Parfums. Jakarta, Indonesia. All rights reserved.',
};

export const settingsRoute = new Elysia({ prefix: '/settings' })
  // Get all site & atelier settings
  .get('/', async () => {
    try {
      const page = await prisma.page.findUnique({
        where: { slug: 'site-settings' },
        include: { sections: true },
      });

      if (!page || !page.sections.length) {
        return { success: true, data: defaultSettings };
      }

      const content = (page.sections[0].contentData as any) || {};
      return {
        success: true,
        data: {
          ...defaultSettings,
          ...content,
        },
      };
    } catch (e: any) {
      return { success: true, data: defaultSettings };
    }
  })

  // Update site & atelier settings
  .put('/', async ({ body, set }) => {
    try {
      const payload = body as any;

      let page = await prisma.page.findUnique({
        where: { slug: 'site-settings' },
        include: { sections: true },
      });

      if (!page) {
        page = await prisma.page.create({
          data: {
            slug: 'site-settings',
            title: 'Site Settings & Contact',
            description: 'Global settings for address, contacts, social media, and footer.',
            isActive: true,
            sections: {
              create: {
                name: 'Global Settings',
                template: SectionTemplate.RICH_TEXT_MEDIA,
                order: 0,
                contentData: payload,
                isActive: true,
              },
            },
          },
          include: { sections: true },
        });
      } else {
        const sectionId = page.sections[0]?.id;
        if (sectionId) {
          const existing = (page.sections[0].contentData as any) || {};
          await prisma.pageSection.update({
            where: { id: sectionId },
            data: {
              contentData: {
                ...existing,
                ...payload,
              },
            },
          });
        } else {
          await prisma.pageSection.create({
            data: {
              pageId: page.id,
              name: 'Global Settings',
              template: SectionTemplate.RICH_TEXT_MEDIA,
              order: 0,
              contentData: payload,
              isActive: true,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Pengaturan toko berhasil diperbarui.',
        data: payload,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
