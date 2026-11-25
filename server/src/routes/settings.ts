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
  officeTitle: 'Kantor & Studio OMOO',
  street: 'Jl. Senopati No. 42, Kebayoran Baru',
  city: 'Jakarta Selatan 12190',
  country: 'Indonesia',
  mapLat: -6.2297,
  mapLng: 106.8073,
  googleMapsUrl: '',
  hours: 'Senin - Sabtu: 10:00 - 20:00 WIB | Minggu: Janji Temu',
  visitNote: 'Kunjungan dengan janji temu',
  shippingFee: 25000,
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
  })

  // Resolve Google Maps URL (including short links like maps.app.goo.gl) into coordinates
  .post(
    '/resolve-maps-link',
    async ({ body, set }) => {
      const rawUrl = (body.url || '').trim();
      if (!rawUrl) {
        set.status = 400;
        return { success: false, message: 'URL Google Maps tidak boleh kosong.' };
      }

      const isValidLatLng = (lat: number, lng: number) =>
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180;

      const extractCoords = (text: string): { lat: number; lng: number } | null => {
        if (!text) return null;
        const patterns = [
          /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
          /@(-?\d+\.\d+),(-?\d+\.\d+)/,
          /[?&](?:q|query|ll|center)=(-?\d+\.\d+)(?:,|%2C|\s)+(-?\d+\.\d+)/i,
          /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/,
        ];

        for (const regex of patterns) {
          const m = text.match(regex);
          if (m) {
            const lat = parseFloat(m[1]);
            const lng = parseFloat(m[2]);
            if (isValidLatLng(lat, lng)) {
              return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
            }
          }
        }
        return null;
      };

      // 1. Try direct extraction first
      const direct = extractCoords(rawUrl);
      if (direct) {
        return { success: true, data: { ...direct, resolvedUrl: rawUrl } };
      }

      // 2. Validate hostname before fetching server-side
      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        set.status = 400;
        return { success: false, message: 'Format link Google Maps tidak valid.' };
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        set.status = 400;
        return { success: false, message: 'Protokol URL harus http atau https.' };
      }

      const allowedHosts = [
        'maps.app.goo.gl',
        'goo.gl',
        'g.co',
        'google.com',
        'www.google.com',
        'maps.google.com',
        'google.co.id',
        'www.google.co.id',
      ];
      const host = parsed.hostname.toLowerCase();
      const isAllowed = allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
      if (!isAllowed) {
        set.status = 400;
        return { success: false, message: 'Gunakan link resmi Google Maps (maps.app.goo.gl atau google.com/maps).' };
      }

      try {
        const res = await fetch(parsed.toString(), {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
          },
        });

        const finalUrl = res.url || rawUrl;
        const fromFinalUrl = extractCoords(decodeURIComponent(finalUrl));
        if (fromFinalUrl) {
          return { success: true, data: { ...fromFinalUrl, resolvedUrl: finalUrl } };
        }

        const html = await res.text();
        const fromHtml = extractCoords(html);
        if (fromHtml) {
          return { success: true, data: { ...fromHtml, resolvedUrl: finalUrl } };
        }

        set.status = 422;
        return {
          success: false,
          message: 'Koordinat tidak ditemukan di link tersebut. Coba buka link di browser lalu salin URL lengkapnya.',
        };
      } catch (err: any) {
        set.status = 500;
        return {
          success: false,
          message: 'Gagal memproses link Google Maps. Silakan coba lagi atau salin URL lengkap dari browser.',
        };
      }
    },
    {
      body: t.Object({
        url: t.String(),
      }),
    }
  );
