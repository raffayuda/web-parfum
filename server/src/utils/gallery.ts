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
    id: 'gal-trio-01',
    title: 'Koleksi Tiga Box Signature 30 ml',
    category: 'Material & Botol',
    eventOrLocation: 'Studio OMOO Jakarta',
    capturedDate: 'November 2026',
    image: '/images/products/trio-editorial.webp',
    description:
      'Tiga edisi kemasan resmi OMOO Eau de Parfum 30 ml — Golden de Brume, Rare, dan Emerald — tertata di bawah cahaya matahari studio.',
    aspect: '4 / 5',
    featured: true,
    createdAt: '2026-11-26T10:00:00.000Z',
  },
  {
    id: 'gal-emerald-02',
    title: 'Morning Tea & Emerald 30 ml',
    category: 'Material & Botol',
    eventOrLocation: 'Atelier Lookup OMOO',
    capturedDate: 'November 2026',
    image: '/images/products/emerald-lifestyle.webp',
    description:
      'Karakter hijau tenang varian Emerald Eau de Parfum bersama seduhan teh hijau hangat dan arsip botani di studio.',
    aspect: '4 / 3',
    featured: true,
    createdAt: '2026-11-24T10:00:00.000Z',
  },
  {
    id: 'gal-rare-03',
    title: 'Eksplorasi Citrus & Madu — Rare',
    category: 'Material & Botol',
    eventOrLocation: 'Arsip Formula OMOO',
    capturedDate: 'November 2026',
    image: '/images/products/rare-mood.webp',
    description:
      'Flacon hitam label emas OMOO Rare bersama bahan baku jeruk segar, bunga orange blossom, dan tetes madu keemasan.',
    aspect: '4 / 5',
    featured: true,
    createdAt: '2026-11-22T10:00:00.000Z',
  },
  {
    id: 'gal-golden-04',
    title: 'Golden de Brume — Velvet & Dusk Box',
    category: 'Dokumentasi Pembuatan',
    eventOrLocation: 'Showcase Kemasan 30 ml',
    capturedDate: 'November 2026',
    image: '/images/products/golden-de-brume-box.webp',
    description:
      'Desain kemasan edisi Golden de Brume 30 ml dengan gradasi hangat yang merepresentasikan aroma amber dan senja.',
    aspect: '4 / 5',
    featured: false,
    createdAt: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'gal-youth-05',
    title: 'Youth & Lumina — Luminous Pink Mist',
    category: 'Behind the Scenes',
    eventOrLocation: 'Pemotretan Kampanye',
    capturedDate: 'November 2026',
    image: '/images/products/youth-lumina-mood.webp',
    description:
      'Visual atmosferik botol Youth & Lumina Eau de Parfum 30 ml dengan kabut floral merah muda yang ekspresif.',
    aspect: '4 / 5',
    featured: false,
    createdAt: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'gal-rare-box-06',
    title: 'Kemasan Marmer Hitam — Edisi Rare',
    category: 'Material & Botol',
    eventOrLocation: 'Studio OMOO Jakarta',
    capturedDate: 'November 2026',
    image: '/images/products/rare-box.webp',
    description:
      'Detail tekstur marmer hitam berasap pada kemasan box OMOO Rare 30 ml.',
    aspect: '4 / 5',
    featured: false,
    createdAt: '2026-11-15T10:00:00.000Z',
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
        title: 'Galeri & Dokumentasi OMOO',
        description: 'Daftar item dokumentasi dan galeri website OMOO.',
        isActive: true,
        sections: {
          create: {
            name: 'Gallery Items Store',
            template: SectionTemplate.RICH_TEXT_MEDIA,
            order: 0,
            contentData: { items: items as any },
            isActive: true,
          },
        },
      },
    });
    return items;
  }

  const firstSection = page.sections[0];
  if (firstSection) {
    await prisma.pageSection.update({
      where: { id: firstSection.id },
      data: { contentData: { items: items as any } },
    });
  } else {
    await prisma.pageSection.create({
      data: {
        pageId: page.id,
        name: 'Gallery Items Store',
        template: SectionTemplate.RICH_TEXT_MEDIA,
        order: 0,
        contentData: { items: items as any },
        isActive: true,
      },
    });
  }

  return items;
}
