import type { ImageMetadata } from 'astro';
import { images, alts } from './images';

export interface JournalBlock {
  type: 'p' | 'h2' | 'quote';
  text: string;
  attribution?: string;
}

export interface JournalPost {
  slug: string;
  title: string;
  deck: string;
  category: string;
  date: string;
  displayDate: string;
  readingTime: string;
  image: ImageMetadata;
  imageAlt: string;
  body: JournalBlock[];
}

export const journal: JournalPost[] = [
  {
    slug: 'the-case-for-wearing-scent-alone',
    title: 'The case for wearing scent alone',
    deck: 'Parfum tidak perlu penonton untuk melakukan pekerjaannya.',
    category: 'Essay',
    date: '2026-05-12',
    displayDate: 'Mei 2026',
    readingTime: '4 menit baca',
    image: images.corridor,
    imageAlt: alts.corridor,
    body: [
      {
        type: 'p',
        text: 'Ada kesenangan tersendiri memakai parfum tanpa rencana. Tanpa makan malam, tanpa pertemuan, tanpa siapa-siapa yang akan mendekat. Anda menyemprotkannya pada Selasa pagi, mengenakan sweter, lalu menjalani hari dengan atmosfer privat yang mengikuti di belakang.',
      },
      {
        type: 'p',
        text: 'Sebagian besar saran parfum mengandaikan penonton. Pakai ini untuk kerja. Pakai itu untuk malam. Pilih yang ia suka. Logikanya praktis, tetapi diam-diam mengubah aroma menjadi kostum. Parfum menjadi pesan untuk orang lain, dengan kulit sebagai amplop.',
      },
      { type: 'h2', text: 'A private architecture' },
      {
        type: 'p',
        text: 'Parfum yang dipakai sendirian melakukan hal yang berbeda. Ia menjadi ruangan di dalam hari. Anda menyadarinya saat menoleh, saat menarik lengan sweter ke pergelangan tangan, saat udara bergerak lewat jendela yang terbuka. Hanya pemakainya yang menjadi penonton, dan pertunjukannya boleh tidak selesai.',
      },
      {
        type: 'p',
        text: 'Karena itu kami membuat extrait, bukan cologne. Konsentrasinya lebih tinggi, pembukaannya lebih lambat, dan drydown-nya mengambil waktu. Tidak ada yang berguna untuk sebuah foto. Semuanya berguna untuk sebuah hidup.',
      },
      {
        type: 'quote',
        text: 'A scent worn alone is not unfinished. It is simply unshared.',
      },
      { type: 'h2', text: 'What changes' },
      {
        type: 'p',
        text: 'Saat tidak ada yang perlu dibuat terkesan, Anda memilih dengan cara yang berbeda. Anda berhenti meraih parfum yang terbaca dari seberang ruangan dan mulai memilih yang terbaca di kerah. Mungkin selera Anda lebih tenang dari yang Anda kira, lebih aneh, atau lebih spesifik.',
      },
      {
        type: 'p',
        text: 'Lain kali Anda mencoba parfum, coba di hari yang kosong. Jangan tanya orang di sebelah Anda. Tunggu satu jam. Baru putuskan.',
      },
    ],
  },
  {
    slug: 'inside-the-maceration-room',
    title: 'Inside the maceration room',
    deck: 'Mengapa sebuah parfum dibiarkan beristirahat sebelum dikemas.',
    category: 'Proses',
    date: '2026-02-03',
    displayDate: 'Februari 2026',
    readingTime: '5 menit baca',
    image: images.maceration,
    imageAlt: alts.maceration,
    body: [
      {
        type: 'p',
        text: 'Ruang pematangan adalah bagian paling tenang di studio kami. Tidak ada bunga di atas meja, tidak ada alat yang dibuat untuk pamer. Yang ada hanya rak, botol kaca gelap, termometer, dan waktu untuk menunggu.',
      },
      {
        type: 'p',
        text: 'Setelah formula selesai diracik dan diencerkan, parfum belum jadi. Campurannya perlu waktu agar material-material saling mengenal. Tepi yang tajam melembut. Alkohol berhenti mengumumkan dirinya. Yang tadinya terasa seperti daftar bahan mulai berbau seperti satu benda.',
      },
      { type: 'h2', text: 'Steel, then glass' },
      {
        type: 'p',
        text: 'Konsentrat beristirahat di stainless steel lebih dulu, terlindung dari cahaya. Setelah itu ia dipindahkan ke kaca dan tinggal di sana beberapa minggu lagi. Kami tidak mencicipi apa pun dan hampir tidak mengukur apa pun. Instrumen yang berguna hanya blotter dan hidung yang bersih, sebaiknya pagi-pagi.',
      },
      {
        type: 'p',
        text: 'Setiap komposisi meminta waktu yang berbeda. Formula yang banyak citrus bisa lebih cepat tenang daripada yang penuh resin. Iris butuh kesabaran. Oud Intime beristirahat selama delapan minggu, bukan karena kalender, tetapi karena pada minggu keenam ia masih berdebat dengan dirinya sendiri.',
      },
      {
        type: 'quote',
        text: 'Time is the only ingredient we cannot buy twice.',
        attribution: 'Camille Aumont, perfumer',
      },
      { type: 'h2', text: 'The quiet part' },
      {
        type: 'p',
        text: 'Tidak ada cara memotret pekerjaan ini dengan meyakinkan. Rak berisi botol gelap di ruangan sejuk terlihat seperti rak berisi botol gelap di ruangan sejuk. Perubahannya terjadi dalam skala yang terlalu kecil untuk dilihat, lalu sekaligus, dan kemudian parfumnya siap.',
      },
      {
        type: 'p',
        text: 'Kami mengemas dalam batch kecil karena ruangannya hanya menampung sebanyak itu. Itu bukan batasan pemasaran. Itu ukuran ruangannya.',
      },
    ],
  },
  {
    slug: 'iris-after-the-frost',
    title: 'Iris, after the frost',
    deck: 'Akar yang meminta waktu bertahun-tahun, bukan berminggu-minggu.',
    category: 'Material',
    date: '2025-11-18',
    displayDate: 'November 2025',
    readingTime: '3 menit baca',
    image: images.macroIris,
    imageAlt: alts.macroIris,
    body: [
      {
        type: 'p',
        text: 'Iris tidak mahal karena langka. Ia mahal karena lambat. Rizomnya diangkat dari tanah, dibersihkan, lalu dibiarkan mengering selama bertahun-tahun. Selama waktu itu pati di dalamnya berubah, dan sebuah molekul bernama iron terbentuk. Hanya setelah itu material bisa disuling menjadi sesuatu yang berbau seperti bedak dingin dan kulit bersih.',
      },
      {
        type: 'p',
        text: 'Bunganya sendiri hampir tidak relevan. Ia indah selama seminggu, lalu pergi. Akarnya yang menjadi tempat parfum tinggal.',
      },
      { type: 'h2', text: 'A material of restraint' },
      {
        type: 'p',
        text: 'Iris tidak mekar di kulit seperti jasmine atau rose. Ia duduk dekat dan tinggal tenang. Di Iris Cendre kami memberinya violet leaf untuk tepi hijau dan suede untuk kehangatan, tetapi akarnya tetap menjadi pusat komposisi. Semua yang lain ada untuk menjaganya agar tidak menghilang.',
      },
      {
        type: 'quote',
        text: 'The powder is what remains after the flower has stopped performing.',
      },
      {
        type: 'p',
        text: 'Sebagian material memberi hadiah pada perhatian. Iris memberi hadiah pada kesabaran. Di pergelangan tangan yang hangat, ia butuh dua puluh menit sebelum mulai berbicara. Setelah itu ia tinggal berjam-jam, lebih dekat daripada yang kebanyakan orang duga.',
      },
    ],
  },
];
