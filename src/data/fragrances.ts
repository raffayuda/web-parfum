import type { ImageMetadata } from 'astro';
import { images, alts } from './images';

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
  bottle: ImageMetadata;
  bottleAlt: string;
  macro: ImageMetadata;
  macroAlt: string;
  card: ImageMetadata;
  cardAlt: string;
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
    slug: 'vetiver-obscura',
    edition: 'OM-01',
    name: 'Vetiver Obscura',
    family: 'Woody',
    tagline: 'Vetiver, smoke, cold citrus.',
    description:
      'Akar vetiver yang lembap, dipotong dingin oleh grapefruit dan dibiarkan mengering bersama cedar.',
    price: 2450000,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleVetiver,
    bottleAlt: alts.bottleVetiver,
    macro: images.macroVetiver,
    macroAlt: alts.macroVetiver,
    card: images.bottleVetiver,
    cardAlt: alts.bottleVetiver,
    notes: {
      top: ['Grapefruit peel', 'Pink pepper'],
      heart: ['Haitian vetiver', 'Orris root'],
      base: ['Cedar', 'Ambrette', 'Incense'],
    },
    material: {
      name: 'Vetiver',
      origin: 'Haiti',
      phrase: 'Akar, asap, tanah basah.',
    },
    story: [
      'Vetiver bukan kayu, melainkan akar. Ia datang bersama tanah yang masih menempel: pahit, hijau, dan sedikit berasap. Kami membangun komposisi di sekitar kesan pertama itu, lalu membiarkan citrus dingin memotongnya.',
      'Pembukaannya terang dan singkat. Yang tersisa lebih tenang dan mineral, lebih dekat ke ruangan batu setelah hujan daripada ke cologne biasa. Ia menempel dekat, lalu tinggal.',
    ],
    quote: {
      text: 'Saya ingin vetiver yang berbau seperti ladang, bukan botol.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Enam minggu',
      longevity: '8 sampai 10 jam',
      sillage: 'Sejauh lengan',
    },
    related: ['fig-nocturne', 'oud-intime'],
  },
  {
    slug: 'iris-cendre',
    edition: 'OM-02',
    name: 'Iris Cendre',
    family: 'Floral',
    tagline: 'Iris, cold powder, suede.',
    description: 'Akar iris pucat, violet leaf, dan sentuhan suede yang menempel hangat di kulit.',
    price: 2550000,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleIris,
    bottleAlt: alts.bottleIris,
    macro: images.macroIris,
    macroAlt: alts.macroIris,
    card: images.bottleIris,
    cardAlt: alts.bottleIris,
    notes: {
      top: ['Bergamot', 'Violet leaf'],
      heart: ['Iris pallida', 'Suede'],
      base: ['Sandalwood', 'Ambrette', 'White musk'],
    },
    material: {
      name: 'Iris',
      origin: 'Tuscany',
      phrase: 'Rizom, bedak dingin, suede.',
    },
    story: [
      'Iris meminta waktu. Rizomnya diangkat, dikeringkan, lalu dibiarkan beristirahat sampai patinya berubah menjadi bedak yang kering seperti kertas. Tidak ada cara untuk mempercepatnya.',
      'Kami menjauhkan bunga dari cahaya. Violet leaf memberi tepi hijau yang dingin; suede dan ambrette melembutkan dasarnya sampai ia duduk seperti kulit kedua.',
    ],
    quote: {
      text: 'Bedaknya harus terasa seperti cashmere di ruang gelap, bukan meja rias.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Empat minggu',
      longevity: '6 sampai 8 jam',
      sillage: 'Dekat',
    },
    related: ['ambrette-12', 'sel-brut'],
  },
  {
    slug: 'fig-nocturne',
    edition: 'OM-03',
    name: 'Fig Nocturne',
    family: 'Green',
    tagline: 'Fig leaf, black fig, green sap.',
    description: 'Pohon fig setelah gelap: getah hijau, buah yang pekat, cedar dan lumut.',
    price: 2450000,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleFig,
    bottleAlt: alts.bottleFig,
    macro: images.macroFig,
    macroAlt: alts.macroFig,
    card: images.macroFig,
    cardAlt: alts.macroFig,
    notes: {
      top: ['Fig leaf', 'Bitter orange'],
      heart: ['Black fig', 'Galbanum'],
      base: ['Cedar', 'Vetiver', 'Moss'],
    },
    material: {
      name: 'Fig',
      origin: 'Calabria',
      phrase: 'Getah hijau, buah pekat, daun.',
    },
    story: [
      'Ada pohon ara di halaman belakang studio kami. Pada bulan Agustus, buahnya matang lebih cepat daripada kemampuan kami memanennya, dan seluruh halaman berbau getah serta daun yang hangat.',
      'Kami ingin bagian hijaunya, bukan selainya. Fig leaf dan galbanum membawa bagian atas. Buahnya duduk di bawah, gelap dan tenang, sementara cedar dan lumut menjaganya agar tidak berubah manis.',
    ],
    quote: {
      text: 'Pohonnya lebih nyaring daripada buahnya. Itulah bagian yang selalu saya cari.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Lima minggu',
      longevity: '7 sampai 9 jam',
      sillage: 'Sejauh lengan',
    },
    related: ['vetiver-obscura', 'sel-brut'],
  },
  {
    slug: 'sel-brut',
    edition: 'OM-04',
    name: 'Sel Brut',
    family: 'Fresh',
    tagline: 'Sea salt, driftwood, wind.',
    description: 'Garam di kulit, udara dingin, dan driftwood yang mengering di bawah matahari.',
    price: 2450000,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleSel,
    bottleAlt: alts.bottleSel,
    macro: images.macroSel,
    macroAlt: alts.macroSel,
    card: images.bottleSel,
    cardAlt: alts.bottleSel,
    notes: {
      top: ['Sea salt', 'Yuzu', 'Pink pepper'],
      heart: ['Driftwood', 'Sage'],
      base: ['Ambergris accord', 'White musk', 'Cedar'],
    },
    material: {
      name: 'Sea salt',
      origin: 'Noirmoutier',
      phrase: 'Mineral, udara, kulit.',
    },
    story: [
      'Sel Brut dimulai di sebuah pantai pada bulan November, dengan angin dari laut dan tidak banyak hal lain di sekitar. Hanya komposisi ini yang berbau udara secara eksplisit.',
      'Sea salt dan yuzu membuat menit pertama terasa tajam. Driftwood, sage, dan accord ambergris mengambil alih perlahan, meninggalkan sesuatu yang hangat dan sedikit animal di kulit.',
    ],
    quote: {
      text: 'Saya ingin momen setelah berenang, bukan lautnya sendiri.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Empat minggu',
      longevity: '6 sampai 8 jam',
      sillage: 'Sedang',
    },
    related: ['fig-nocturne', 'ambrette-12'],
  },
  {
    slug: 'oud-intime',
    edition: 'OM-05',
    name: 'Oud Intime',
    family: 'Oriental',
    tagline: 'Oud, rose, saffron, leather.',
    description: 'Oud gelap dan mawar yang ditahan dekat. Saffron, leather, dan jejak incense.',
    price: 3450000,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 25%',
    bottle: images.bottleOud,
    bottleAlt: alts.bottleOud,
    macro: images.macroOud,
    macroAlt: alts.macroOud,
    card: images.bottleOud,
    cardAlt: alts.bottleOud,
    notes: {
      top: ['Saffron', 'Rose'],
      heart: ['Oud', 'Leather'],
      base: ['Patchouli', 'Tonka bean', 'Incense'],
    },
    material: {
      name: 'Oud',
      origin: 'Assam',
      phrase: 'Resin, leather, panas.',
    },
    story: [
      'Oud bisa menguasai ruangan sebelum seseorang masuk. Kami ingin yang sebaliknya: material gelap yang ditahan dekat, hanya terungkap ketika seseorang mendekat.',
      'Saffron dan mawar membuka komposisi dengan kehangatan kering yang hampir metalik. Oud dan leather menyusul, dilembutkan patchouli dan tonka. Ini bukan parfum yang berisik. Ia panjang.',
    ],
    quote: {
      text: 'Intimasi adalah soal jarak. Yang ini menjawab dari dekat.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '25%',
      maceration: 'Delapan minggu',
      longevity: '10 sampai 12 jam',
      sillage: 'Dekat dan tahan lama',
    },
    related: ['vetiver-obscura', 'iris-cendre'],
  },
  {
    slug: 'ambrette-12',
    edition: 'OM-06',
    name: 'Ambrette 12',
    family: 'Musk',
    tagline: 'Ambrette seed, almond, warm linen.',
    description: 'Musk yang berperilaku seperti kulit. Ambrette, almond, dan linen hangat.',
    price: 2450000,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleAmbrette,
    bottleAlt: alts.bottleAmbrette,
    macro: images.macroAmbrette,
    macroAlt: alts.macroAmbrette,
    card: images.macroAmbrette,
    cardAlt: alts.macroAmbrette,
    notes: {
      top: ['Almond', 'Hay'],
      heart: ['Ambrette seed', 'Iris'],
      base: ['White musk', 'Vanilla', 'Cedar'],
    },
    material: {
      name: 'Ambrette',
      origin: 'Ecuador',
      phrase: 'Musk, kulit pir, linen.',
    },
    story: [
      'Ambrette adalah biji yang berbau musk, yang membuatnya sekaligus material dan ilusi. Kami membangun komposisi paling lembut di koleksi ini di sekelilingnya.',
      'Almond dan hay memberi bagian atas kehangatan yang kering dan sedikit seperti kacang. Ambrette dan iris menjaga tengahnya. Dasarnya hampir tidak ada: white musk, sedikit vanilla, cedar. Ini parfum yang kami pakai ketika tidak ingin menjelaskan diri.',
    ],
    quote: {
      text: 'Hal terakhir yang Anda sadari seharusnya menjadi hal yang Anda ingat.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Enam minggu',
      longevity: '5 sampai 7 jam',
      sillage: 'Hampir tak terasa',
    },
    related: ['iris-cendre', 'sel-brut'],
  },
];

export const bySlug = (slug: string) => fragrances.find((fragrance) => fragrance.slug === slug);

export const featured = ['vetiver-obscura', 'fig-nocturne', 'iris-cendre', 'oud-intime'].map(
  (slug) => bySlug(slug)!
);

export const families = ['All', 'Woody', 'Floral', 'Green', 'Fresh', 'Oriental', 'Musk'];

export const materials = fragrances.map((fragrance) => ({
  ...fragrance.material,
  slug: fragrance.slug,
  edition: fragrance.edition,
  image: fragrance.macro,
  alt: fragrance.macroAlt,
}));

export const priceLabel = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
