import type { ImageMetadata } from 'astro';

export interface FragranceGalleryImage {
  url: string;
  alt: string;
  label?: string;
}

export interface Fragrance {
  slug: string;
  edition: string;
  name: string;
  family: string;
  tagline: string;
  description: string;
  price: number;
  volume: string;
  concentration: string;
  isAvailable?: boolean;
  bottle: ImageMetadata | string;
  bottleAlt: string;
  macro: ImageMetadata | string;
  macroAlt: string;
  card: ImageMetadata | string;
  cardAlt: string;
  galleryImages?: FragranceGalleryImage[];
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  material: {
    name: string;
    origin: string;
    phrase: string;
  };
  story: string[];
  quote: {
    text: string;
    attribution: string;
  };
  performance: {
    concentration: string;
    maceration: string;
    longevity: string;
    sillage: string;
  };
  related: string[];
}

export const fragrances: Fragrance[] = [
  {
    slug: 'emerald',
    edition: 'OM-01',
    name: 'Emerald',
    family: 'Green',
    tagline: 'Dewy green tea, crisp foliage, serene bergamot.',
    description:
      'Kesegaran daun teh hijau hangat dan embun pagi di balik jendela kayu, berpadu dengan kelembutan bergamot dan cedar bersih.',
    price: 485000,
    volume: '30 ml',
    concentration: 'Eau de parfum, 20%',
    bottle: '/images/products/emerald-lifestyle.webp',
    bottleAlt: 'Botol kaca bulat OMOO Emerald Eau de Parfum 30 ml di atas nampan kayu dengan secangkir teh hijau',
    macro: '/images/products/emerald-box.webp',
    macroAlt: 'Kemasan box hijau botanical OMOO Emerald 30 ml dengan pita satin',
    card: '/images/products/emerald-lifestyle.webp',
    cardAlt: 'OMOO Emerald Eau de Parfum 30 ml',
    galleryImages: [
      {
        url: '/images/products/emerald-lifestyle.webp',
        alt: 'OMOO Emerald 30 ml bersama seduhan teh hijau hangat',
        label: 'Suasana & Botol',
      },
      {
        url: '/images/products/emerald-studio.webp',
        alt: 'Foto studio close-up botol bulat tutup emas OMOO Emerald 30 ml',
        label: 'Detail Botol',
      },
      {
        url: '/images/products/emerald-box.webp',
        alt: 'Kemasan eksklusif OMOO Emerald 30 ml',
        label: 'Kemasan Box',
      },
      {
        url: '/images/products/trio-editorial.webp',
        alt: 'Koleksi tiga box OMOO termasuk Emerald, Rare, dan Golden de Brume',
        label: 'Koleksi Trio',
      },
    ],
    notes: {
      top: ['Bergamot', 'Green tea leaf', 'Morning dew'],
      heart: ['White fig leaf', 'Jasmine bud', 'Neroli'],
      base: ['White cedar', 'Soft vetiver', 'Clean musk'],
    },
    material: {
      name: 'Green Tea',
      origin: 'Jawa Barat & Uji',
      phrase: 'Daun teh basah, embun pagi, ketenangan.',
    },
    story: [
      'Emerald lahir dari suasana pagi yang tenang: secangkir teh hijau hangat di atas meja kayu, halaman buku botani yang terbuka, dan cahaya jendela yang lembut.',
      'Aromanya dibuka oleh kesegaran daun teh dan citrus lembut yang jernih, lalu menetap rapi di kulit sebagai wangi hijau bersih yang menenangkan sepanjang hari.',
    ],
    quote: {
      text: 'Ketentraman di pagi hari yang diringkas dalam botol kaca 30 ml.',
      attribution: 'OMOO Studio, Jakarta',
    },
    performance: {
      concentration: '20%',
      maceration: 'Enam minggu',
      longevity: '7 sampai 9 jam',
      sillage: 'Jernih & menenangkan',
    },
    related: ['golden-de-brume', 'youth-lumina'],
  },
  {
    slug: 'golden-de-brume',
    edition: 'OM-02',
    name: 'Golden de Brume',
    family: 'Oriental',
    tagline: 'Sunlit amber, warm desert breeze, velvet musk.',
    description:
      'Kehangatan sinar matahari senja di balik bukit pasir keemasan, diracik dengan sentuhan amber manis, saffron halus, dan beludru kayu cendana.',
    price: 520000,
    volume: '30 ml',
    concentration: 'Eau de parfum, 20%',
    bottle: '/images/products/golden-de-brume-mood.webp',
    bottleAlt: 'Botol OMOO Golden de Brume 30 ml di atas kain beludru marun dengan sorotan cahaya emas',
    macro: '/images/products/golden-de-brume-box.webp',
    macroAlt: 'Kemasan box OMOO Golden de Brume 30 ml di atas hamparan pasir senja',
    card: '/images/products/golden-de-brume-mood.webp',
    cardAlt: 'OMOO Golden de Brume Eau de Parfum 30 ml',
    galleryImages: [
      {
        url: '/images/products/golden-de-brume-mood.webp',
        alt: 'OMOO Golden de Brume 30 ml di atas kain beludru marun bercahaya emas',
        label: 'Edisi Beludru',
      },
      {
        url: '/images/products/golden-de-brume-studio.webp',
        alt: 'Foto studio close-up botol OMOO Golden de Brume 30 ml',
        label: 'Detail Botol',
      },
      {
        url: '/images/products/golden-de-brume-box.webp',
        alt: 'Kemasan box OMOO Golden de Brume 30 ml di bukit pasir senja',
        label: 'Kemasan Box',
      },
    ],
    notes: {
      top: ['Cardamom', 'Saffron thread', 'Mandarin zest'],
      heart: ['Golden amber', 'Toasted Tonka', 'Damask rose'],
      base: ['Sandalwood', 'Benzoin resin', 'Warm vanilla'],
    },
    material: {
      name: 'Golden Amber',
      origin: 'Oman & Nusantara',
      phrase: 'Kabut emas, resin hangat, senja gurun.',
    },
    story: [
      'Golden de Brume menangkap momen keemasan menjelang petang—hangat, memikat, namun tetap lembut memeluk kulit seperti kain beludru.',
      'Perpaduan resin amber, rempah cardamom, dan sandalwood lembut meninggalkan jejak elegan yang berkelas dari sore hingga larut malam.',
    ],
    quote: {
      text: 'Seperti kabut keemasan yang bertahan hangat jauh setelah matahari tenggelam.',
      attribution: 'OMOO Studio, Jakarta',
    },
    performance: {
      concentration: '20%',
      maceration: 'Delapan minggu',
      longevity: '8 sampai 11 jam',
      sillage: 'Hangat & memeluk',
    },
    related: ['rare', 'emerald'],
  },
  {
    slug: 'rare',
    edition: 'OM-03',
    name: 'Rare',
    family: 'Citrus',
    tagline: 'Bitter orange blossom, molten honey, dark woods.',
    description:
      'Karakter berani dalam flacon hitam berlabel emas: kesegaran jeruk matang dan bunga neroli yang diselimuti madu hangat dan kayu gelap.',
    price: 545000,
    volume: '30 ml',
    concentration: 'Eau de parfum, 20%',
    bottle: '/images/products/rare-mood.webp',
    bottleAlt: 'Botol hitam label emas OMOO Rare 30 ml bersama potongan jeruk segar, bunga putih, dan tetesan madu',
    macro: '/images/products/rare-box.webp',
    macroAlt: 'Kemasan box marmer hitam berasap OMOO Rare 30 ml',
    card: '/images/products/rare-mood.webp',
    cardAlt: 'OMOO Rare Eau de Parfum 30 ml',
    galleryImages: [
      {
        url: '/images/products/rare-mood.webp',
        alt: 'Botol OMOO Rare 30 ml bersama jeruk, bunga neroli, dan sirup madu keemasan',
        label: 'Citrus & Madu',
      },
      {
        url: '/images/products/rare-stage.webp',
        alt: 'Botol hitam OMOO Rare 30 ml di atas panggung kabut dramatis',
        label: 'Edisi Malam',
      },
      {
        url: '/images/products/rare-box.webp',
        alt: 'Kemasan box marmer hitam OMOO Rare 30 ml',
        label: 'Kemasan Box',
      },
    ],
    notes: {
      top: ['Bitter orange', 'Blood mandarin', 'Citrus peel'],
      heart: ['Orange blossom', 'Wild honey', 'Spiced jasmine'],
      base: ['Smoked oud', 'Patchouli', 'Dark amber'],
    },
    material: {
      name: 'Neroli & Honey',
      origin: 'Seville & Aceh',
      phrase: 'Jeruk pahit, tetes madu, kayu hitam.',
    },
    story: [
      'Rare mematahkan anggapan bahwa aroma citrus selalu ringan. Kami mempertemukan perasan jeruk segar dan bunga orange blossom dengan madu liar serta kayu gelap yang intens.',
      'Hasilnya adalah aroma berlapis emas yang tegas, sensual, dan sulit dilupakan di ruangan mana pun Anda melangkah.',
    ],
    quote: {
      text: 'Kontras antara kesegaran jeruk dan kedalaman kayu gelap berbalut madu.',
      attribution: 'OMOO Studio, Jakarta',
    },
    performance: {
      concentration: '20%',
      maceration: 'Delapan minggu',
      longevity: '9 sampai 12 jam',
      sillage: 'Berani & berkarakter',
    },
    related: ['golden-de-brume', 'youth-lumina'],
  },
  {
    slug: 'youth-lumina',
    edition: 'OM-04',
    name: 'Youth & Lumina',
    family: 'Floral',
    tagline: 'Pink peony mist, velvet peach, luminous musk.',
    description:
      'Pancaran energi muda yang ceria dan berkilau: perpaduan kelopak mawar merah muda, buah persik lembut, dan vanilla praline yang ringan di kulit.',
    price: 495000,
    volume: '30 ml',
    concentration: 'Eau de parfum, 20%',
    bottle: '/images/products/youth-lumina-mood.webp',
    bottleAlt: 'Botol OMOO Youth & Lumina 30 ml dengan kepulan kabut merah muda artistik',
    macro: '/images/products/youth-lumina-box.webp',
    macroAlt: 'Kemasan box pastel artistik OMOO Youth & Lumina 30 ml',
    card: '/images/products/youth-lumina-mood.webp',
    cardAlt: 'OMOO Youth & Lumina Eau de Parfum 30 ml',
    galleryImages: [
      {
        url: '/images/products/youth-lumina-mood.webp',
        alt: 'OMOO Youth & Lumina 30 ml dengan kepulan kabut floral merah muda',
        label: 'Luminous Mist',
      },
      {
        url: '/images/products/youth-lumina-studio.webp',
        alt: 'Foto studio close-up botol OMOO Youth & Lumina 30 ml',
        label: 'Detail Botol',
      },
      {
        url: '/images/products/youth-lumina-box.webp',
        alt: 'Kemasan box OMOO Youth & Lumina 30 ml',
        label: 'Kemasan Box',
      },
    ],
    notes: {
      top: ['Pink pepper', 'White peach', 'Lychee'],
      heart: ['Pink peony', 'Damask rose', 'Magnolia'],
      base: ['Soft praline', 'White musk', 'Cashmere wood'],
    },
    material: {
      name: 'Pink Peony',
      origin: 'Grasse',
      phrase: 'Kelopak mawar muda, praline lembut, kilau musk.',
    },
    story: [
      'Youth & Lumina merayakan sisi yang cerah, ekspresif, dan penuh daya hidup—dituang dalam botol kaca bening bermahkota emas.',
      'Kelopak peony merah muda dan buah lychee berpadu manis halus di atas musk lembut, cocok dipakai sehari-hari maupun momen spesial.',
    ],
    quote: {
      text: 'Aroma floral modern yang bercahaya tanpa pernah terasa berlebihan.',
      attribution: 'OMOO Studio, Jakarta',
    },
    performance: {
      concentration: '20%',
      maceration: 'Enam minggu',
      longevity: '7 sampai 9 jam',
      sillage: 'Memikat & lembut',
    },
    related: ['emerald', 'rare'],
  },
];

export const bySlug = (slug: string) => fragrances.find((fragrance) => fragrance.slug === slug);

export const featured = fragrances;

export const families = ['All', 'Green', 'Oriental', 'Citrus', 'Floral'];

export const materials = fragrances.map((fragrance) => ({
  ...fragrance.material,
  slug: fragrance.slug,
  edition: fragrance.edition,
  image: fragrance.bottle,
  alt: fragrance.bottleAlt,
}));

export const priceLabel = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
