import { PrismaClient, UserRole, MemberStatus, SectionTemplate, CertType } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OMOO Database...');

  // 1. Seed Admin User
  const adminEmail = 'admin@omoo.studio';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  let adminUser = existingAdmin;
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

    // Create password credential for better-auth
    // Password hash for: 'admin123456'
    // Better Auth uses scrypt or bcrypt; we store a standard hash or account entry
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

  // 3. Seed Fragrances Catalog
  const initialFragrances = [
    {
      slug: 'vetiver-obscura',
      edition: 'OM-01',
      name: 'Vetiver Obscura',
      family: 'Woody',
      tagline: 'Vetiver, smoke, cold citrus.',
      description: 'Akar vetiver yang lembap, dipotong dingin oleh grapefruit dan dibiarkan mengering bersama cedar.',
      price: 2450000,
      volume: '50 ml',
      concentration: 'Extrait de parfum, 20%',
      isAvailable: true,
      stockCount: 24,
        bottleImage: '/images/bottle-vetiver.jpg',
        bottleAlt: 'Botol kaca berat Omoo Vetiver Obscura dengan tutup hitam',
        macroImage: '/images/macro-vetiver.jpg',
      macroAlt: 'Akar vetiver kering dengan latar belakang batu hitam',
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
        'Vetiver bukan kayu, melainkan akar. Ia datang bersama tanah yang masih menempel: pahit, hijau, dan sedikit berasap.',
        'Pembukaannya terang dan singkat. Yang tersisa lebih tenang dan mineral, lebih dekat ke ruangan batu setelah hujan daripada ke cologne biasa.',
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
      relatedSlugs: ['fig-nocturne', 'oud-intime'],
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
      isAvailable: true,
      stockCount: 18,
      bottleImage: '/images/bottle-iris.jpg',
      bottleAlt: 'Botol kaca Omoo Iris Cendre',
      macroImage: '/images/macro-iris.jpg',
      macroAlt: 'Rimpang iris pucat yang mengering',
      notes: {
        top: ['Violet leaf', 'Angelica root'],
        heart: ['Tuscan orris butter', 'Carrot seed'],
        base: ['White suede', 'Cedar', 'Clean musk'],
      },
      material: {
        name: 'Iris Pallida',
        origin: 'Tuscany',
        phrase: 'Bedak dingin, suede, perak.',
      },
      story: [
        'Iris adalah aroma waktu. Rimpangnya harus dikeringkan tiga tahun sebelum mentega wangi bisa diekstraksi.',
        'Hasilnya adalah bedak paling halus: bukan aroma manis toko kosmetik, melainkan debu marmer yang sejuk.',
      ],
      quote: {
        text: 'Iris adalah parfum tanpa gender paling tenang di dunia.',
        attribution: 'Studio Note, 2021',
      },
      performance: {
        concentration: '20%',
        maceration: 'Delapan minggu',
        longevity: '7 sampai 9 jam',
        sillage: 'Intimate to moderate',
      },
      relatedSlugs: ['vetiver-obscura', 'ambrette-12'],
    },
    {
      slug: 'fig-nocturne',
      edition: 'OM-03',
      name: 'Fig Nocturne',
      family: 'Green',
      tagline: 'Fig leaf, milky sap, bitter bark.',
      description: 'Daun ara gelap yang dihancurkan di malam hari. Getah putih yang pahit dan kayu lembap.',
      price: 2350000,
      volume: '50 ml',
      concentration: 'Extrait de parfum, 20%',
      isAvailable: true,
      stockCount: 15,
      bottleImage: '/images/bottle-fig.jpg',
      bottleAlt: 'Botol kaca Omoo Fig Nocturne',
      macroImage: '/images/macro-fig.jpg',
      macroAlt: 'Daun ara segar dengan tetesan getah putih',
      notes: {
        top: ['Crushed fig leaf', 'Cardamom'],
        heart: ['Milky fig sap', 'Black tea'],
        base: ['Fig bark', 'Iso E Super', 'Dry amber'],
      },
      material: {
        name: 'Fig Leaf',
        origin: 'Provence',
        phrase: 'Daun patah, getah susu, malam basah.',
      },
      story: [
        'Bukan buah ara manis, melainkan aroma tajam saat daunnya diremas dalam genggaman tangan di udara malam.',
        'Ada kesejukan hijau yang bergeser perlahan menjadi kehangatan kayu kering.',
      ],
      performance: {
        concentration: '20%',
        maceration: 'Lima minggu',
        longevity: '8 jam',
        sillage: 'Moderate',
      },
      relatedSlugs: ['sel-marin', 'vetiver-obscura'],
    },
    {
      slug: 'sel-marin',
      edition: 'OM-04',
      name: 'Sel Marin',
      family: 'Fresh',
      tagline: 'Sea salt, seaweed, dry driftwood.',
      description: 'Garam laut kasar di atas batu karang, alga kering, dan kayu apung yang dijemur matahari pesisir.',
      price: 2300000,
      volume: '50 ml',
      concentration: 'Extrait de parfum, 20%',
      isAvailable: true,
      stockCount: 30,
      bottleImage: '/images/bottle-sel.jpg',
      bottleAlt: 'Botol kaca Omoo Sel Marin',
      macroImage: '/images/macro-sel.jpg',
      macroAlt: 'Kristal garam laut kasar',
      notes: {
        top: ['Marine salt', 'Bergamot peel'],
        heart: ['Kelp absolute', 'Sage'],
        base: ['Driftwood', 'Ambroxan', 'White cedar'],
      },
      material: {
        name: 'Sea Kelp',
        origin: 'Brittany',
        phrase: 'Garam, ombak dingin, kayu lapuk.',
      },
      story: [
        'Aroma udara laut yang sesungguhnya: mineral, bersih, asin, dengan kedalaman yang tak bertepi.',
      ],
      performance: {
        concentration: '20%',
        maceration: 'Enam minggu',
        longevity: '7 sampai 8 jam',
        sillage: 'Moderate',
      },
      relatedSlugs: ['fig-nocturne', 'ambrette-12'],
    },
    {
      slug: 'oud-intime',
      edition: 'OM-05',
      name: 'Oud Intime',
      family: 'Oriental',
      tagline: 'Wild agarwood, dark honey, leather.',
      description: 'Gaharu liar dari Kalimantan Timur, disuling lambat dengan sentuhan madu hutan dan kulit tua.',
      price: 2850000,
      volume: '50 ml',
      concentration: 'Extrait de parfum, 22%',
      isAvailable: true,
      stockCount: 10,
      bottleImage: '/images/bottle-oud.jpg',
      bottleAlt: 'Botol kaca Omoo Oud Intime',
      macroImage: '/images/macro-oud.jpg',
      macroAlt: 'Serpihan kayu gaharu resin gelap',
      notes: {
        top: ['Wild honey', 'Nutmeg'],
        heart: ['Assam agarwood', 'Turkish rose'],
        base: ['Birch tar leather', 'Vanilla bean', 'Benzoin'],
      },
      material: {
        name: 'Agarwood (Gaharu)',
        origin: 'East Kalimantan',
        phrase: 'Resin tua, asap sakral, kehangatan gelap.',
      },
      story: [
        'Gaharu liar yang dipanen secara lestari. Bukan oud sintetis yang menusuk, tetapi resonansi kayu yang mendalam dan intim di atas kulit.',
      ],
      performance: {
        concentration: '22%',
        maceration: 'Sepuluh minggu',
        longevity: '12+ jam',
        sillage: 'Strong & lingering',
      },
      relatedSlugs: ['vetiver-obscura', 'iris-cendre'],
    },
    {
      slug: 'ambrette-12',
      edition: 'OM-06',
      name: 'Ambrette 12',
      family: 'Musk',
      tagline: 'Botanical musk, pear skin, warm linen.',
      description: 'Musk nabati dari biji ambrette, kulit pir dingin, dan tekstur linen yang dijemur angin pagi.',
      price: 2650000,
      volume: '50 ml',
      concentration: 'Extrait de parfum, 20%',
      isAvailable: false, // Intentionally Unavailable to test & demonstrate out of stock badge
      stockCount: 0,
      bottleImage: '/images/bottle-ambrette.jpg',
      bottleAlt: 'Botol kaca Omoo Ambrette 12',
      macroImage: '/images/macro-ambrette.jpg',
      macroAlt: 'Biji ambrette botani',
      notes: {
        top: ['Pear skin', 'Ambrette seed'],
        heart: ['Iris concrete', 'Cashmeran'],
        base: ['Iso-musk', 'Sandalwood', 'Clean amber'],
      },
      material: {
        name: 'Ambrette Seed',
        origin: 'Martinique',
        phrase: 'Musk nabati, kelembutan intim, kulit kedua.',
      },
      story: [
        'Satu-satunya musk alami yang berasal dari tanaman. Ambrette 12 adalah edisi terbatas yang saat ini sedang menunggu batch panen berikutnya.',
      ],
      performance: {
        concentration: '20%',
        maceration: 'Tujuh minggu',
        longevity: '8 jam',
        sillage: 'Skin scent',
      },
      relatedSlugs: ['iris-cendre', 'sel-marin'],
    },
  ];

  for (const frag of initialFragrances) {
    await prisma.fragrance.upsert({
      where: { slug: frag.slug },
      update: frag,
      create: frag,
    });
  }
  console.log(`Seeded ${initialFragrances.length} fragrances into catalogue.`);

  // 4. Seed Halal & BPOM Certifications
  const certs = [
    {
      certType: CertType.BPOM,
      certNumber: 'NA18230601234',
      productSlug: 'vetiver-obscura',
      productName: 'OMOO Vetiver Obscura Extrait de Parfum 50ml',
      authority: 'Badan Pengawas Obat dan Makanan Republik Indonesia (BPOM RI)',
      issueDate: new Date('2024-03-12'),
      validUntil: new Date('2029-03-12'),
      verifyCode: 'BPOM-OM01-VETIVER',
      status: 'VERIFIED',
      details: {
        laboratory: 'Balai Uji Mutu Kosmetika Nasional',
        batchTested: 'OM-VO-2024-B1',
        dermatologicallyTested: true,
        heavyMetalFree: true,
      },
    },
    {
      certType: CertType.BPOM,
      certNumber: 'NA18230601235',
      productSlug: 'iris-cendre',
      productName: 'OMOO Iris Cendre Extrait de Parfum 50ml',
      authority: 'Badan Pengawas Obat dan Makanan Republik Indonesia (BPOM RI)',
      issueDate: new Date('2024-04-18'),
      validUntil: new Date('2029-04-18'),
      verifyCode: 'BPOM-OM02-IRIS',
      status: 'VERIFIED',
      details: {
        laboratory: 'Balai Uji Mutu Kosmetika Nasional',
        batchTested: 'OM-IC-2024-B1',
        dermatologicallyTested: true,
        heavyMetalFree: true,
      },
    },
    {
      certType: CertType.HALAL,
      certNumber: 'ID31110001234560124',
      productSlug: 'vetiver-obscura',
      productName: 'OMOO Studio Fragrance Formulations (Seluruh Varian)',
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
      description: 'Omoo adalah rumah parfum kecil di Jakarta. Enam komposisi extrait de parfum, diracik dari material pilihan, dibuat perlahan.',
      sections: [
        {
          name: 'Hero Editorial',
          template: SectionTemplate.HERO_EDITORIAL,
          order: 1,
          eyebrow: 'Parfum Independen, Jakarta',
          title: 'Wear what cannot be seen.',
          subtitle: 'Enam komposisi dengan bahan pilihan, diracik dalam batch kecil di Jakarta. Tahan lama di kulit.',
          contentData: {
            ctaText: 'Explore Collection',
            ctaLink: '/collection',
            secondaryText: 'Tentang OMOO',
            secondaryLink: '/about',
          },
        },
        {
          name: 'Fragrance Grid Showcase',
          template: SectionTemplate.FRAGRANCE_GRID,
          order: 2,
          eyebrow: 'Koleksi',
          title: 'Enam Komposisi',
          subtitle: 'Extrait de parfum konsentrasi 20% ke atas. Tersedia dalam botol 50 ml bernomor seri.',
          contentData: {
            limit: 6,
            showFilters: true,
          },
        },
        {
          name: 'Material Story (Asal Bahan)',
          template: SectionTemplate.MATERIAL_STORY,
          order: 3,
          eyebrow: 'Bahan Baku',
          title: 'One material at a time.',
          subtitle: 'Kami memilih bahan utama sebelum merancang formula. Dari akar vetiver Haiti hingga gaharu liar Kalimantan.',
          contentData: {
            materials: [
              { name: 'Vetiver', origin: 'Haiti', quote: 'Akar, asap, dan tanah basah setelah hujan.' },
              { name: 'Iris Pallida', origin: 'Tuscany', quote: 'Rimpang beristirahat tiga tahun sebelum disuling lambat.' },
              { name: 'Wild Oud', origin: 'Kalimantan', quote: 'Kayu resin murni, dipanen etis dalam lot kecil.' },
            ],
          },
        },
        {
          name: 'Proses Peracikan',
          template: SectionTemplate.PROCESS_STEPS,
          order: 4,
          eyebrow: 'Proses',
          title: 'Diracik perlahan.',
          subtitle: 'Tidak terburu-buru mengejar jadwal pasar. Formula matang menentukan kapan ia siap dikemas.',
          contentData: {
            steps: [
              { step: '01', title: 'Peracikan', desc: 'Satu bahan utama memimpin. Catatan lain ditulis mengelilinginya tanpa menutupinya.' },
              { step: '02', title: 'Pematangan', desc: 'Konsentrat beristirahat dalam kaca gelap selama 6 hingga 10 minggu hingga aromanya menyatu halus.' },
              { step: '03', title: 'Pembotolan', desc: 'Setiap botol diisi, disegel, dan diberi nomor seri secara manual di studio Jakarta.' },
            ],
          },
        },
        {
          name: 'Halal & BPOM Authenticity Seal',
          template: SectionTemplate.HALAL_BPOM_BADGE,
          order: 5,
          eyebrow: 'Legality & Trust',
          title: 'Sertifikasi Resmi BPOM & Halal',
          subtitle: 'Ketenangan jiwa dalam setiap semprotan. Seluruh formula OMOO telah teruji di laboratorium independen, terdaftar resmi di BPOM RI, dan bersertifikat Halal Indonesia.',
          contentData: {
            showQrScanner: true,
            featuredCode: 'BPOM-OM01-VETIVER',
          },
        },
        {
          name: 'Discovery Set CTA',
          template: SectionTemplate.DISCOVERY_BANNER,
          order: 6,
          eyebrow: 'Sample the House',
          title: 'Discovery Set (6 x 2 ml)',
          subtitle: 'Kenali seluruh keenam wewangian di kulit Anda sebelum memilih satu flacon penuh. Nilai set dapat digunakan sebagai voucher potongan untuk botol 50 ml berikutnya.',
          contentData: {
            price: 450000,
            ctaText: 'Pesan Discovery Set',
            ctaLink: '/collection#discovery-set',
          },
        },
        {
          name: 'Frequently Asked Questions',
          template: SectionTemplate.FAQ_ACCORDION,
          order: 7,
          eyebrow: 'Inquiries',
          title: 'Frequently Asked Questions',
          subtitle: 'Jawaban atas pertanyaan seputar formulasi, perawatan botol, dan pemesanan.',
          contentData: {
            faqs: [
              { q: 'Apakah parfum OMOO unisex?', a: 'Ya, kami tidak mengotakkan wewangian berdasarkan gender. Material alamilah yang berbicara.' },
              { q: 'Bagaimana cara terbaik menyimpan flacon?', a: 'Simpan berdiri tegak di tempat yang sejuk dan terlindung dari sinar matahari langsung.' },
              { q: 'Bagaimana cara konfirmasi pembayaran QRIS?', a: 'Setelah transfer berhasil, unggah bukti bayar di halaman web atau klik konfirmasi via WhatsApp kami.' },
            ],
          },
        },
      ],
    },
    {
      slug: 'maison',
      title: 'Maison Omoo',
      description: 'Rumah parfum independen yang berakar di Jakarta, didirikan dengan kecintaan mendalam pada bahan mentah botanikal murni.',
      sections: [
        {
          name: 'Maison Hero Split',
          template: SectionTemplate.HERO_SPLIT,
          order: 1,
          eyebrow: 'About the House',
          title: 'A house built around one material at a time.',
          subtitle: 'Didirikan di Jakarta Selatan pada tahun 2019, Omoo adalah eksplorasi tanpa kompromi terhadap esensi material mentah wewangian.',
          contentData: {
            imageUrl: '/images/atelier.jpg',
            imageAlt: 'Studio OMOO di Jakarta',
          },
        },
        {
          name: 'Origins & Philosophy',
          template: SectionTemplate.RICH_TEXT_MEDIA,
          order: 2,
          eyebrow: 'Philosophy',
          title: 'Slowness as an act of resistance.',
          subtitle: 'Dalam dunia yang menuntut kecepatan instan, kami memilih waktu. Enam minggu maserasi adalah standar minimum kami.',
          contentData: {
            paragraphs: [
              'Kami tidak merilis wewangian berdasarkan tren musim. Setiap formula lahir dari dialog intim dengan para penanam dan penyuling bahan baku di berbagai penjuru dunia.',
              'Dari distrik Grasse hingga pedalaman hutan Kalimantan, kami mengumpulkan esensi murni terbaik.',
            ],
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

    // Delete existing sections to recreate cleanly in seed
    await prisma.pageSection.deleteMany({ where: { pageId: page.id } });

    for (const sec of p.sections) {
      await prisma.pageSection.create({
        data: {
          pageId: page.id,
          name: sec.name,
          template: sec.template,
          order: sec.order,
          title: sec.title,
          eyebrow: sec.eyebrow,
          subtitle: sec.subtitle,
          contentData: sec.contentData,
          isActive: true,
        },
      });
    }
    console.log(`Seeded page '${p.slug}' with ${p.sections.length} sections.`);
  }

  // 6. Seed Demo Orders for Customer Tracker
  const demoOrder = await prisma.order.upsert({
    where: { orderNumber: 'OM-20261122-0042' },
    update: {},
    create: {
      orderNumber: 'OM-20261122-0042',
      userId: demoUser.id,
      customerName: demoUser.name,
      customerEmail: demoUser.email,
      customerPhone: demoUser.phone || '+6281234567890',
      shippingAddress: 'Jl. Senopati No. 42, RT 01 / RW 02',
      shippingCity: 'Jakarta Selatan',
      shippingPostal: '12190',
      shippingCourier: 'JNE YES',
      trackingNumber: 'JNE109823481234',
      totalAmount: 2450000,
      paymentMethod: 'QRIS',
      status: 'PROCESSING',
      paymentProofUrl: '/uploads/receipts/demo-receipt.png',
      paymentProofNote: 'Transfer via BCA QRIS m-Banking',
      validatedAt: new Date(),
      validatedBy: adminUser.name,
      adminNotes: 'Pembayaran telah tervalidasi. Botol OM-01 seri #084 sedang dikemas dalam kotak velvet.',
      items: {
        create: [
          {
            name: 'Vetiver Obscura Extrait de Parfum',
            volume: '50 ml',
            quantity: 1,
            unitPrice: 2450000,
            subtotal: 2450000,
          },
        ],
      },
    },
  });
  console.log(`Seeded demo order: ${demoOrder.orderNumber}`);

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
