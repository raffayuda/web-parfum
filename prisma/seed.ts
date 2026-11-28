import { PrismaClient, UserRole, MemberStatus, SectionTemplate, CertType } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { DEFAULT_EDITORIAL_SLIDES } from '../src/data/carousel';
import { GALLERY_PAGE_SLUG, DEFAULT_GALLERY_ITEMS } from '../server/src/utils/gallery';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OMOO Database...');

  // 1. Seed Admin User
  const adminEmail = 'admin@omoo.studio';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: 'Camille Aumont (Admin)',
        email: adminEmail,
        emailVerified: true,
        phone: '+6281200000000',
        role: UserRole.ADMIN,
        memberStatus: MemberStatus.ACTIVE,
        memberTier: 'Director',
      },
    });

    const passwordHash = await hashPassword('admin123456');
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: 'credential',
        password: passwordHash,
      },
    });
    console.log('Created Admin user: admin@omoo.studio / admin123456');
  }

  // 2. Seed Customer Demo User
  const demoEmail = 'customer@omoo.studio';
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        name: 'Nadia Pratama',
        email: demoEmail,
        emailVerified: true,
        phone: '+6281234567890',
        role: UserRole.CUSTOMER,
        memberStatus: MemberStatus.ACTIVE,
        memberTier: 'Cercle Privé',
        memberSince: new Date('2026-01-15'),
      },
    });

    const demoPasswordHash = await hashPassword('customer123');
    await prisma.account.create({
      data: {
        userId: demoUser.id,
        accountId: demoUser.id,
        providerId: 'credential',
        password: demoPasswordHash,
      },
    });
    console.log('Created Demo Customer: customer@omoo.studio / customer123');
  }

  // 3. Remove Old Placeholder Perfumes & Seed Real 4 Variants (30 ml)
  const legacyPlaceholderSlugs = [
    'vetiver-obscura',
    'iris-cendre',
    'fig-nocturne',
    'sel-marin',
    'oud-intime',
    'ambrette-12',
  ];

  await prisma.fragrance.deleteMany({
    where: { slug: { in: legacyPlaceholderSlugs } },
  });

  const initialFragrances = [
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
      isAvailable: true,
      stockCount: 25,
      bottleImage: '/images/products/emerald-lifestyle.webp',
      bottleAlt: 'Botol kaca bulat OMOO Emerald Eau de Parfum 30 ml di atas nampan kayu dengan teh hijau',
      macroImage: '/images/products/emerald-box.webp',
      macroAlt: 'Kemasan box hijau botanical OMOO Emerald 30 ml dengan pita satin',
      galleryImages: [
        { url: '/images/products/emerald-lifestyle.webp', alt: 'OMOO Emerald 30 ml bersama seduhan teh hijau hangat', label: 'Suasana & Botol' },
        { url: '/images/products/emerald-studio.webp', alt: 'Foto studio close-up botol bulat tutup emas OMOO Emerald 30 ml', label: 'Detail Botol' },
        { url: '/images/products/emerald-box.webp', alt: 'Kemasan eksklusif OMOO Emerald 30 ml', label: 'Kemasan Box' },
        { url: '/images/products/trio-editorial.webp', alt: 'Koleksi tiga box OMOO termasuk Emerald, Rare, dan Golden de Brume', label: 'Koleksi Trio' },
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
      relatedSlugs: ['golden-de-brume', 'youth-lumina'],
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
      isAvailable: true,
      stockCount: 20,
      bottleImage: '/images/products/golden-de-brume-mood.webp',
      bottleAlt: 'Botol OMOO Golden de Brume 30 ml di atas kain beludru marun dengan sorotan cahaya emas',
      macroImage: '/images/products/golden-de-brume-box.webp',
      macroAlt: 'Kemasan box OMOO Golden de Brume 30 ml di atas hamparan pasir senja',
      galleryImages: [
        { url: '/images/products/golden-de-brume-mood.webp', alt: 'OMOO Golden de Brume 30 ml di atas kain beludru marun bercahaya emas', label: 'Edisi Beludru' },
        { url: '/images/products/golden-de-brume-studio.webp', alt: 'Foto studio close-up botol OMOO Golden de Brume 30 ml', label: 'Detail Botol' },
        { url: '/images/products/golden-de-brume-box.webp', alt: 'Kemasan box OMOO Golden de Brume 30 ml di bukit pasir senja', label: 'Kemasan Box' },
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
      relatedSlugs: ['rare', 'emerald'],
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
      isAvailable: true,
      stockCount: 18,
      bottleImage: '/images/products/rare-mood.webp',
      bottleAlt: 'Botol hitam label emas OMOO Rare 30 ml bersama jeruk segar, bunga putih, dan madu',
      macroImage: '/images/products/rare-box.webp',
      macroAlt: 'Kemasan box marmer hitam berasap OMOO Rare 30 ml',
      galleryImages: [
        { url: '/images/products/rare-mood.webp', alt: 'Botol OMOO Rare 30 ml bersama jeruk, bunga neroli, dan sirup madu keemasan', label: 'Citrus & Madu' },
        { url: '/images/products/rare-stage.webp', alt: 'Botol hitam OMOO Rare 30 ml di atas panggung kabut dramatis', label: 'Edisi Malam' },
        { url: '/images/products/rare-box.webp', alt: 'Kemasan box marmer hitam OMOO Rare 30 ml', label: 'Kemasan Box' },
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
      relatedSlugs: ['golden-de-brume', 'youth-lumina'],
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
      isAvailable: true,
      stockCount: 22,
      bottleImage: '/images/products/youth-lumina-mood.webp',
      bottleAlt: 'Botol OMOO Youth & Lumina 30 ml dengan kepulan kabut merah muda artistik',
      macroImage: '/images/products/youth-lumina-box.webp',
      macroAlt: 'Kemasan box pastel artistik OMOO Youth & Lumina 30 ml',
      galleryImages: [
        { url: '/images/products/youth-lumina-mood.webp', alt: 'OMOO Youth & Lumina 30 ml dengan kepulan kabut floral merah muda', label: 'Luminous Mist' },
        { url: '/images/products/youth-lumina-studio.webp', alt: 'Foto studio close-up botol OMOO Youth & Lumina 30 ml', label: 'Detail Botol' },
        { url: '/images/products/youth-lumina-box.webp', alt: 'Kemasan box OMOO Youth & Lumina 30 ml', label: 'Kemasan Box' },
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
      relatedSlugs: ['emerald', 'rare'],
    },
  ];

  for (const frag of initialFragrances) {
    await prisma.fragrance.upsert({
      where: { slug: frag.slug },
      update: frag,
      create: frag,
    });
  }
  console.log(`Seeded ${initialFragrances.length} real OMOO fragrances into catalogue.`);

  // 4. Clean old cert links & Seed Halal & BPOM Certifications
  await prisma.certification.deleteMany({
    where: { verifyCode: { in: ['BPOM-OM01-VETIVER', 'BPOM-OM02-IRIS'] } },
  });

  const certs = [
    {
      certType: CertType.BPOM,
      certNumber: 'NA18230601234',
      productSlug: 'emerald',
      productName: 'OMOO Emerald Eau de Parfum 30ml',
      authority: 'Badan Pengawas Obat dan Makanan Republik Indonesia (BPOM RI)',
      issueDate: new Date('2024-03-12'),
      validUntil: new Date('2029-03-12'),
      verifyCode: 'BPOM-OM01-EMERALD',
      status: 'VERIFIED',
      details: {
        laboratory: 'Balai Uji Mutu Kosmetika Nasional',
        batchTested: 'OM-EM-2026-B1',
        dermatologicallyTested: true,
        heavyMetalFree: true,
      },
    },
    {
      certType: CertType.BPOM,
      certNumber: 'NA18230601235',
      productSlug: 'golden-de-brume',
      productName: 'OMOO Golden de Brume Eau de Parfum 30ml',
      authority: 'Badan Pengawas Obat dan Makanan Republik Indonesia (BPOM RI)',
      issueDate: new Date('2024-04-18'),
      validUntil: new Date('2029-04-18'),
      verifyCode: 'BPOM-OM02-GOLDEN',
      status: 'VERIFIED',
      details: {
        laboratory: 'Balai Uji Mutu Kosmetika Nasional',
        batchTested: 'OM-GD-2026-B1',
        dermatologicallyTested: true,
        heavyMetalFree: true,
      },
    },
    {
      certType: CertType.HALAL,
      certNumber: 'ID31110001234560124',
      productSlug: 'emerald',
      productName: 'OMOO Studio Fragrance Formulations (Seluruh Varian 30ml)',
      authority: 'Badan Penyelenggara Jaminan Produk Halal (BPJPH) & MUI',
      issueDate: new Date('2024-01-20'),
      validUntil: new Date('2028-01-20'),
      verifyCode: 'HALAL-OMOO-2024',
      status: 'VERIFIED',
      details: {
        standard: 'HAS 23000',
        solventGrade: 'Pure Plant-derived Ethanol 99.8% (Non-Khamr)',
        animalCrueltyFree: true,
      },
    },
  ];

  for (const cert of certs) {
    await prisma.certification.upsert({
      where: { verifyCode: cert.verifyCode },
      update: cert,
      create: cert,
    });
  }
  console.log(`Seeded ${certs.length} Halal & BPOM certifications.`);

  // 5. Seed Pages and Dynamic Sections
  const pagesData = [
    {
      slug: 'home',
      title: 'Perfume, made slowly',
      description: 'Omoo adalah rumah parfum kecil di Jakarta. Empat komposisi eau de parfum 30 ml, diracik dari material pilihan.',
      sections: [
        {
          name: 'Hero Editorial',
          template: SectionTemplate.HERO_EDITORIAL,
          order: 1,
          eyebrow: 'Parfum Independen, Jakarta',
          title: 'Wear what cannot be seen.',
          subtitle: 'Empat komposisi khas OMOO dalam kemasan 30 ml, diracik dalam batch kecil di Jakarta. Tahan lama di kulit.',
          contentData: {
            ctaText: 'Explore Collection',
            ctaLink: '/collection',
            secondaryText: 'Find your scent',
            secondaryLink: '/find',
          },
        },
        {
          name: 'Atelier Lookbook Carousel',
          template: SectionTemplate.EDITORIAL_CAROUSEL,
          order: 2,
          eyebrow: 'Atelier Lookbook • Edisi 30 ml',
          title: 'Empat karakter. Kemasan baru.',
          subtitle: 'Geser untuk melihat detail botol, box eksklusif, dan suasana tiap komposisi.',
          contentData: {
            autoplayMs: 6500,
            slides: DEFAULT_EDITORIAL_SLIDES as any,
          },
        },
        {
          name: 'Fragrance Grid Showcase',
          template: SectionTemplate.FRAGRANCE_GRID,
          order: 3,
          eyebrow: 'Koleksi 30 ml',
          title: 'Satu karakter, satu komposisi.',
          subtitle: 'Lihat semua parfum',
          contentData: {
            limit: 6,
            showFilters: true,
            footerQuote: 'Koleksi kami dijaga tetap fokus agar setiap batch dapat dikontrol langsung kualitas aromanya.',
          },
        },
        {
          name: 'Material Story (Asal Bahan)',
          template: SectionTemplate.MATERIAL_STORY,
          order: 4,
          eyebrow: 'Bahan Baku',
          title: 'Materials, satu per satu.',
          subtitle: 'Setiap komposisi dimulai dari bahan utama terpilih — dari daun teh hijau hingga amber hangat dan jeruk pahit.',
          contentData: {
            materials: [
              { name: 'Green Tea', origin: 'Jawa Barat & Uji', quote: 'Daun teh basah, embun pagi, ketenangan.' },
              { name: 'Golden Amber', origin: 'Oman & Nusantara', quote: 'Kabut emas, resin hangat, senja gurun.' },
              { name: 'Neroli & Honey', origin: 'Seville & Aceh', quote: 'Jeruk pahit, tetes madu, kayu hitam.' },
              { name: 'Pink Peony', origin: 'Grasse', quote: 'Kelopak mawar muda, praline lembut, kilau musk.' },
            ],
          },
        },
        {
          name: 'Proses Peracikan',
          template: SectionTemplate.PROCESS_STEPS,
          order: 5,
          eyebrow: 'Proses',
          title: 'Diracik perlahan.',
          subtitle: 'Tidak terburu-buru mengejar jadwal pasar. Formula matang menentukan kapan ia siap dikemas.',
          contentData: {
            steps: [
              { step: '01', title: 'Peracikan', desc: 'Satu bahan utama memimpin. Catatan lain ditulis mengelilinginya tanpa menutupinya.' },
              { step: '02', title: 'Pematangan', desc: 'Konsentrat beristirahat dalam kaca gelap selama 6 hingga 8 minggu hingga aromanya menyatu halus.' },
              { step: '03', title: 'Pembotolan', desc: 'Setiap botol 30 ml diisi, disegel, dan dimasukkan ke dalam kotak eksklusif OMOO.' },
            ],
          },
        },
        {
          name: 'Halal & BPOM Authenticity Seal',
          template: SectionTemplate.HALAL_BPOM_BADGE,
          order: 6,
          eyebrow: 'Legality & Trust',
          title: 'Sertifikasi Resmi BPOM & Halal',
          subtitle: 'Ketenangan jiwa dalam setiap semprotan. Seluruh formula OMOO telah teruji di laboratorium independen, terdaftar resmi di BPOM RI, dan bersertifikat Halal Indonesia.',
          contentData: {
            showQrScanner: true,
            featuredCode: 'BPOM-OM01-EMERALD',
          },
        },
        {
          name: 'Discovery Set CTA',
          template: SectionTemplate.DISCOVERY_BANNER,
          order: 7,
          eyebrow: 'Sample the House',
          title: 'Discovery Set (4 x 2 ml)',
          subtitle: 'Kenali seluruh keempat varian OMOO di kulit Anda sebelum memilih flacon 30 ml penuh.',
          contentData: {
            price: 195000,
            ctaText: 'Pesan Discovery Set',
            ctaLink: '/collection#discovery-set',
          },
        },
        {
          name: 'Frequently Asked Questions',
          template: SectionTemplate.FAQ_ACCORDION,
          order: 8,
          eyebrow: 'Inquiries',
          title: 'Frequently Asked Questions',
          subtitle: 'Jawaban atas pertanyaan seputar formulasi, perawatan botol, dan pemesanan.',
          contentData: {
            faqs: [
              { q: 'Apakah parfum OMOO unisex?', a: 'Ya, kami tidak mengotakkan wewangian berdasarkan gender. Material alamilah yang berbicara.' },
              { q: 'Bagaimana cara terbaik menyimpan flacon?', a: 'Simpan berdiri tegak di tempat yang sejuk dan terlindung dari sinar matahari langsung.' },
              { q: 'Bagaimana cara konfirmasi pembayaran QRIS?', a: 'Setelah transfer berhasil, unggah bukti bayar di halaman web atau konfirmasi via WhatsApp admin kami.' },
            ],
          },
        },
      ],
    },
    {
      slug: GALLERY_PAGE_SLUG,
      title: 'Galeri & Dokumentasi OMOO',
      description: 'Daftar item dokumentasi dan galeri website OMOO.',
      sections: [
        {
          name: 'Gallery Items Store',
          template: SectionTemplate.RICH_TEXT_MEDIA,
          order: 0,
          contentData: { items: DEFAULT_GALLERY_ITEMS as any },
        },
      ],
    },
    {
      slug: 'about',
      title: 'About Us — OMOO',
      description: 'Mengenal OMOO: rumah parfum independen baru di Jakarta yang meracik empat komposisi 30 ml dalam batch kecil.',
      sections: [
        {
          name: 'About Studio Story',
          template: SectionTemplate.HERO_SPLIT,
          order: 1,
          eyebrow: 'Bab Pertama OMOO — Jakarta',
          title: 'Lahir untuk aroma yang jujur.',
          subtitle: 'Sebagai rumah parfum baru, kami memilih melangkah perlahan dengan empat komposisi 30 ml yang matang.',
          contentData: {
            elements: {
              'about-title': 'Lahir untuk aroma yang jujur.',
              'about-deck': 'OMOO adalah rumah parfum independen yang memulai bab pertamanya dari Jakarta. Kami meracik empat komposisi 30 ml dalam batch kecil dengan ketelitian dan karakter yang jujur.',
            },
            images: {
              'about-hero-img': '/images/products/trio-editorial.webp',
            },
            timeline: [
              { id: 'pillar-01', year: '01', copy: 'Formulasi jujur dalam batch kecil — setiap varian OMOO lahir dari keseimbangan aroma yang teruji langsung, bukan mengejar tren sesaat.' },
              { id: 'pillar-02', year: '02', copy: 'Pematangan bertahap (maceration) dalam botol kaca gelap agar kesegaran pembuka dan kehangatan dasar menyatu halus di kulit.' },
              { id: 'pillar-03', year: '03', copy: 'Kemasan 30 ml yang ringkas, elegan, dan siap dipakai setiap hari maupun dibawa bepergian tanpa kehilangan kesan mewah.' },
              { id: 'pillar-04', year: '04', copy: 'Komitmen kualitas & transparansi — dikerjakan dengan standar mutu ketat, bersertifikat resmi BPOM dan Halal Indonesia.' },
            ],
          },
        },
      ],
    },
    {
      slug: 'maison',
      title: 'Maison Omoo',
      description: 'Rumah parfum independen yang lahir di Jakarta, berfokus pada empat komposisi 30 ml dengan kualitas terjaga.',
      sections: [
        {
          name: 'Maison Hero Split',
          template: SectionTemplate.HERO_SPLIT,
          order: 1,
          eyebrow: 'About the House',
          title: 'Lahir untuk aroma yang jujur.',
          subtitle: 'OMOO memulai perjalanannya dari studio peracikan di Jakarta, fokus pada empat komposisi Eau de Parfum 30 ml.',
          contentData: {
            imageUrl: '/images/products/trio-editorial.webp',
            imageAlt: 'Koleksi Perdana OMOO 30 ml',
          },
        },
      ],
    },
    {
      slug: 'contact',
      title: 'Kontak & Kunjungan',
      description: 'Kunjungi studio OMOO di Jakarta atau hubungi kami untuk informasi produk dan pemesanan.',
      sections: [
        {
          name: 'Contact Header',
          template: SectionTemplate.HERO_SPLIT,
          order: 1,
          eyebrow: 'Hubungi Kami',
          title: 'Kunjungi, Hubungi & Pesan.',
          subtitle: 'Studio kami menerima kunjungan pribadi dengan perjanjian terlebih dahulu dari Selasa hingga Jumat.',
          contentData: {
            imageUrl: '/images/atelier-door.jpg',
            imageAlt: 'Pintu masuk studio OMOO',
          },
        },
        {
          name: 'Concierge FAQ',
          template: SectionTemplate.FAQ_ACCORDION,
          order: 2,
          eyebrow: 'Bantuan',
          title: 'Pertanyaan Umum Pengunjung',
          subtitle: 'Panduan kunjungan studio dan pemesanan.',
          contentData: {
            faqs: [
              { q: 'Bagaimana cara membuat janji kunjungan?', a: 'Kirimkan pesan ke WhatsApp Concierge kami minimal 2 hari sebelum tanggal yang diinginkan.' },
              { q: 'Apakah bisa memesan custom blend pribadi?', a: 'Layanan bespoke formula saat ini hanya dibuka untuk anggota Cercle Privé terpilih.' },
            ],
          },
        },
      ],
    },
  ];

  for (const p of pagesData) {
    const page = await prisma.page.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
      },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
      },
    });

    await prisma.pageSection.deleteMany({ where: { pageId: page.id } });

    for (const sec of p.sections) {
      await prisma.pageSection.create({
        data: {
          pageId: page.id,
          name: sec.name,
          template: sec.template,
          order: sec.order,
          title: (sec as any).title,
          eyebrow: (sec as any).eyebrow,
          subtitle: (sec as any).subtitle,
          contentData: sec.contentData,
          isActive: true,
        },
      });
    }
    console.log(`Seeded page '${p.slug}' with ${p.sections.length} sections.`);
  }

  console.log('✅ OMOO Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
