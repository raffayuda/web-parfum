import { SectionTemplate } from '@prisma/client';
import { prisma } from '../db';

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  eventOrLocation: string;
  capturedDate: string;
  image: string;
  description: string;
  aspect?: string;
  featured?: boolean;
  createdAt: string;
}

export const GALLERY_PAGE_SLUG = 'gallery-items';

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-maserasi-01',
    title: 'Proses Maserasi Batch Pertama',
    category: 'Dokumentasi Pembuatan',
    eventOrLocation: 'Studio OMOO Jakarta',
    capturedDate: 'November 2026',
    image: '/images/atelier.jpg',
    description:
      'Tahap pengendapan konsentrat extrait dalam botol kaca tertutup bersuhu terkendali sebelum disaring dan dikemas. Langkah ini menyatukan karakter top, heart, dan base notes agar terasa bulat di kulit.',
    aspect: '16 / 10',
    featured: true,
    createdAt: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'gal-popup-02',
    title: 'Pop-Up Showcase & Tes Aroma Perdana',
    category: 'Event & Collab',
    eventOrLocation: 'Kemang, Jakarta Selatan',
    capturedDate: 'November 2026',
    image: '/images/corridor.jpg',
    description:
      'Sesi perkenalan perdana koleksi OMOO bersama komunitas kreatif dan pencinta wewangian lokal. Pengunjung mencoba langsung seluruh varian ekstrak di atas kulit dan berdiskusi tentang komposisi favorit mereka.',
    aspect: '4 / 5',
    featured: true,
    createdAt: '2026-11-14T10:00:00.000Z',
  },
  {
    id: 'gal-bottling-03',
    title: 'Pengisian & Penyegelan Botol 50 ml',
    category: 'Behind the Scenes',
    eventOrLocation: 'Meja Produksi Jakarta',
    capturedDate: 'Oktober 2026',
    image: '/images/bottle-vetiver.jpg',
    description:
      'Setiap botol 50 ml diisi, diperiksa kejernihan cairannya, diberi label nomor batch, dan disegel satu per satu secara manual sebelum masuk ke kotak pengiriman.',
    aspect: '4 / 5',
    featured: true,
    createdAt: '2026-10-28T10:00:00.000Z',
  },
  {
    id: 'gal-vetiver-04',
    title: 'Seleksi Material Akar Vetiver',
    category: 'Material & Botol',
    eventOrLocation: 'Arsip Bahan Baku OMOO',
    capturedDate: 'Oktober 2026',
    image: '/images/macro-vetiver.jpg',
    description:
      'Pengujian sampel minyak atsiri akar vetiver berkarakter tanah lembap dan asap tipis yang menjadi fondasi komposisi Vetiver Obscura.',
    aspect: '1 / 1',
    featured: false,
    createdAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'gal-oud-05',
    title: 'Eksplorasi Resin & Kayu Gaharu',
    category: 'Material & Botol',
    eventOrLocation: 'Arsip Bahan Baku OMOO',
    capturedDate: 'Oktober 2026',
    image: '/images/macro-oud.jpg',
    description:
      'Dokumentasi pengujian resin dan ekstrak kayu gaharu bersama komposisi rempah hangat untuk seri malam.',
    aspect: '1 / 1',
    featured: false,
    createdAt: '2026-10-12T10:00:00.000Z',
  },
  {
    id: 'gal-sel-06',
    title: 'Rilis Awal Varian Sel Marin',
    category: 'Dokumentasi Pembuatan',
    eventOrLocation: 'Batch 01 — Jakarta',
    capturedDate: 'Oktober 2026',
    image: '/images/bottle-sel.jpg',
    description:
      'Foto dokumentasi batch perdana varian Sel Marin 50 ml setelah melewati tahap stabilisasi aroma.',
    aspect: '4 / 5',
    featured: false,
    createdAt: '2026-10-05T10:00:00.000Z',
  },
];

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: GALLERY_PAGE_SLUG },
      include: { sections: true },
    });

    const content = (page?.sections?.[0]?.contentData as any) || null;
    if (content && Array.isArray(content.items)) {
      return content.items;
    }

    return DEFAULT_GALLERY_ITEMS;
  } catch {
    return DEFAULT_GALLERY_ITEMS;
  }
}

export async function saveGalleryItems(items: GalleryItem[]): Promise<GalleryItem[]> {
  const page = await prisma.page.findUnique({
    where: { slug: GALLERY_PAGE_SLUG },
    include: { sections: true },
  });

  if (!page) {
    await prisma.page.create({
      data: {
        slug: GALLERY_PAGE_SLUG,
        title: 'Gallery & Dokumentasi',
        description: 'Daftar foto dokumentasi, kolaborasi event, dan proses pembuatan OMOO.',
        isActive: true,
        sections: {
          create: {
            name: 'Gallery Items',
            template: SectionTemplate.GALLERY_GRID,
            order: 0,
            contentData: { items } as any,
            isActive: true,
          },
        },
      },
    });
    return items;
  }

  if (page.sections.length === 0) {
    await prisma.pageSection.create({
      data: {
        pageId: page.id,
        name: 'Gallery Items',
        template: SectionTemplate.GALLERY_GRID,
        order: 0,
        contentData: { items } as any,
        isActive: true,
      },
    });
    return items;
  }

  await prisma.pageSection.update({
    where: { id: page.sections[0].id },
    data: {
      contentData: { items } as any,
    },
  });

  return items;
}
