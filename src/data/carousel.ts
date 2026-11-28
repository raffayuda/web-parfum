export interface EditorialSlide {
  id: string;
  editionNumber: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  volumeBadge: string;
  mainImage: string;
  mainAlt: string;
  insetImage: string;
  insetAlt: string;
  ctaText: string;
  ctaLink: string;
  accentTone?: 'emerald' | 'gold' | 'amber' | 'rose';
}

export const DEFAULT_EDITORIAL_SLIDES: EditorialSlide[] = [
  {
    id: 'slide-trio',
    editionNumber: '00',
    eyebrow: 'Signature 30 ml Lineup',
    title: 'The Atelier Trio',
    subtitle: 'Tiga karakter utama dalam kemasan 30 ml terbaru.',
    description:
      'Dari kesegaran hijau Emerald, kehangatan senja Golden de Brume, hingga ketegasan citrus bermadu dari Rare. Hadir dalam botol kaca dan box bertekstur khas OMOO.',
    volumeBadge: 'Eau de Parfum • 30 ml',
    mainImage: '/images/products/trio-editorial.webp',
    mainAlt: 'Koleksi tiga box OMOO Eau de Parfum 30 ml di bawah cahaya hangat studio',
    insetImage: '/images/products/trio-flatlay.webp',
    insetAlt: 'Flat-lay tiga box produk OMOO Golden de Brume, Rare, dan Emerald',
    ctaText: 'Lihat Semua Varian',
    ctaLink: '/collection/',
    accentTone: 'gold',
  },
  {
    id: 'slide-emerald',
    editionNumber: '01',
    eyebrow: 'Green & Botanical',
    title: 'Emerald',
    subtitle: 'Daun teh hijau hangat, embun pagi, cedar bersih.',
    description:
      'Terinspirasi dari ketenangan pagi hari bersama seduhan teh hijau di ruang kayu. Ringan, jernih, dan menenangkan dari semprotan pertama hingga senja.',
    volumeBadge: 'OM-01 • 30 ml',
    mainImage: '/images/products/emerald-lifestyle.webp',
    mainAlt: 'Botol OMOO Emerald 30 ml bersama teh hijau hangat dan buku botani',
    insetImage: '/images/products/emerald-box.webp',
    insetAlt: 'Kemasan box hijau OMOO Emerald 30 ml dengan pita satin',
    ctaText: 'Jelajahi Emerald',
    ctaLink: '/collection/emerald/',
    accentTone: 'emerald',
  },
  {
    id: 'slide-golden',
    editionNumber: '02',
    eyebrow: 'Oriental & Warm Amber',
    title: 'Golden de Brume',
    subtitle: 'Kabut emas, amber hangat, beludru sandalwood.',
    description:
      'Keanggunan cahaya senja keemasan yang membalut kulit seperti kain beludru. Diracik dari resin amber, rempah cardamom lembut, dan kayu cendana.',
    volumeBadge: 'OM-02 • 30 ml',
    mainImage: '/images/products/golden-de-brume-mood.webp',
    mainAlt: 'Botol OMOO Golden de Brume 30 ml di atas beludru marun',
    insetImage: '/images/products/golden-de-brume-box.webp',
    insetAlt: 'Kemasan box OMOO Golden de Brume 30 ml di bukit pasir senja',
    ctaText: 'Jelajahi Golden de Brume',
    ctaLink: '/collection/golden-de-brume/',
    accentTone: 'gold',
  },
  {
    id: 'slide-rare',
    editionNumber: '03',
    eyebrow: 'Citrus & Dark Woods',
    title: 'Rare',
    subtitle: 'Jeruk matang, tetes madu liar, kayu hitam.',
    description:
      'Flacon hitam berlabel emas dengan kontras memikat antara kesegaran jeruk pahit, bunga orange blossom, madu hangat, dan sentuhan kayu oud gelap.',
    volumeBadge: 'OM-03 • 30 ml',
    mainImage: '/images/products/rare-mood.webp',
    mainAlt: 'Botol hitam label emas OMOO Rare 30 ml dengan jeruk dan madu',
    insetImage: '/images/products/rare-box.webp',
    insetAlt: 'Kemasan box marmer hitam OMOO Rare 30 ml',
    ctaText: 'Jelajahi Rare',
    ctaLink: '/collection/rare/',
    accentTone: 'amber',
  },
  {
    id: 'slide-youth-lumina',
    editionNumber: '04',
    eyebrow: 'Floral & Luminous',
    title: 'Youth & Lumina',
    subtitle: 'Kelopak peony merah muda, persik segar, musk lembut.',
    description:
      'Komposisi cerah dan penuh daya hidup—menggabungkan keanggunan kelopak peony, manis tipis buah lychee-peach, dan kehalusan cashmere musk.',
    volumeBadge: 'OM-04 • 30 ml',
    mainImage: '/images/products/youth-lumina-mood.webp',
    mainAlt: 'Botol OMOO Youth & Lumina 30 ml dengan kabut merah muda artistik',
    insetImage: '/images/products/youth-lumina-box.webp',
    insetAlt: 'Kemasan box pastel OMOO Youth & Lumina 30 ml',
    ctaText: 'Jelajahi Youth & Lumina',
    ctaLink: '/collection/youth-lumina/',
    accentTone: 'rose',
  },
];
