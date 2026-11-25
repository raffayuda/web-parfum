import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { resolvePublicImageUrl } from '../../data/images';
import { Button } from '../../components/ui/react/Button';
import { Input, Textarea } from '../../components/ui/react/Input';
import { Badge } from '../../components/ui/react/Badge';
import { Modal } from '../../components/ui/react/Modal';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  Upload,
  X,
} from 'lucide-react';

export const CatalogTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Sub-view router: 'list' | 'create' | 'edit' | 'detail'
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedPerfume, setSelectedPerfume] = useState<any>(null);

  // List view mode: 'table' vs 'grid' (card)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Custom Delete Confirmation Modal state (NO BROWSER ALERT)
  const [perfumeToDelete, setPerfumeToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states for all landing page perfume fields
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [slug, setSlug] = useState('');
  const [family, setFamily] = useState('Woody');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('2450000');
  const [volume, setVolume] = useState('50 ml');
  const [concentration, setConcentration] = useState('Extrait de parfum, 20%');
  const [stockCount, setStockCount] = useState('24');
  const [isAvailable, setIsAvailable] = useState(true);

  // Visual Photos
  const [bottleImage, setBottleImage] = useState('/images/bottle-vetiver.jpg');
  const [macroImage, setMacroImage] = useState('/images/macro-vetiver.jpg');

  // Composition Notes (comma separated)
  const [notesTop, setNotesTop] = useState('Grapefruit peel, Pink pepper');
  const [notesHeart, setNotesHeart] = useState('Haitian vetiver, Orris root');
  const [notesBase, setNotesBase] = useState('Cedar, Ambrette, Incense');

  // Material & Story
  const [materialName, setMaterialName] = useState('Vetiver');
  const [materialOrigin, setMaterialOrigin] = useState('Haiti');
  const [materialPhrase, setMaterialPhrase] = useState('Akar, asap, tanah basah.');
  const [story, setStory] = useState(
    'Vetiver bukan kayu, melainkan akar. Ia datang bersama tanah yang masih menempel: pahit, hijau, dan sedikit berasap.\n\nPembukaannya terang dan singkat. Yang tersisa lebih tenang dan mineral, lebih dekat ke ruangan batu setelah hujan daripada ke cologne biasa.'
  );

  // Perfumer Quote
  const [quoteText, setQuoteText] = useState('Saya ingin vetiver yang berbau seperti ladang, bukan botol.');
  const [quoteAttribution, setQuoteAttribution] = useState('Camille Aumont, perfumer');

  // Performance
  const [maceration, setMaceration] = useState('Enam minggu');
  const [longevity, setLongevity] = useState('8 sampai 10 jam');
  const [sillage, setSillage] = useState('Sejauh lengan');

  // Preset photo options
  const presetBottlePhotos = [
    { label: 'Botol Vetiver Obscura', url: '/images/bottle-vetiver.jpg' },
    { label: 'Botol Iris Cendre', url: '/images/bottle-iris.jpg' },
    { label: 'Botol Fig Nocturne', url: '/images/bottle-fig.jpg' },
    { label: 'Botol Sel Marin', url: '/images/bottle-sel.jpg' },
    { label: 'Botol Oud Intime', url: '/images/bottle-oud.jpg' },
    { label: 'Botol Ambrette 12', url: '/images/bottle-ambrette.jpg' },
  ];

  const presetMacroPhotos = [
    { label: 'Makro Vetiver Root', url: '/images/macro-vetiver.jpg' },
    { label: 'Makro Iris Rhizome', url: '/images/macro-iris.jpg' },
    { label: 'Makro Fig Leaf', url: '/images/macro-fig.jpg' },
    { label: 'Makro Mineral Salt', url: '/images/macro-sel.jpg' },
    { label: 'Makro Oud Wood', url: '/images/macro-oud.jpg' },
    { label: 'Makro Ambrette Seed', url: '/images/macro-ambrette.jpg' },
  ];

  const [isUploadingBottle, setIsUploadingBottle] = useState(false);
  const [isUploadingMacro, setIsUploadingMacro] = useState(false);

  const handleFileUpload = async (file: File, target: 'bottle' | 'macro') => {
    try {
      if (target === 'bottle') setIsUploadingBottle(true);
      else setIsUploadingMacro(true);

      const res = await api.uploadFile(file, 'perfumes');
      if (res.success && res.url) {
        if (target === 'bottle') {
          setBottleImage(res.url);
          toast.success('Foto botol wewangian berhasil diunggah!');
        } else {
          setMacroImage(res.url);
          toast.success('Foto makro wewangian berhasil diunggah!');
        }
      } else {
        toast.error(res.message || 'Gagal mengunggah gambar.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      if (target === 'bottle') setIsUploadingBottle(false);
      else setIsUploadingMacro(false);
    }
  };

  // Fetch all perfumes
  const { data: perfumesData, isLoading } = useQuery({
    queryKey: ['admin-perfumes'],
    queryFn: () => api.getPerfumes(),
  });

  const perfumes = perfumesData?.data || [];

  // Toggle availability mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.togglePerfumeAvailability(id, isAvailable),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
      toast.success(
        `Status stok berhasil diperbarui menjadi ${variables.isAvailable ? 'Tersedia' : 'Stok Habis'}`
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui status ketersediaan stok');
    },
  });

  // Create perfume mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createPerfume(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
      toast.success(`Parfum "${res.data?.name || name}" berhasil ditambahkan ke katalog!`);
      setCurrentView('list');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menambahkan parfum baru');
    },
  });

  // Update perfume mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePerfume(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
      toast.success(`Katalog wewangian "${res.data?.name || name}" berhasil diperbarui!`);
      setCurrentView('list');
      setSelectedPerfume(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui data parfum');
    },
  });

  // Delete perfume mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePerfume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
      toast.success('Parfum berhasil dihapus dari katalog.');
      setIsDeleteModalOpen(false);
      setPerfumeToDelete(null);
      if (currentView !== 'list') setCurrentView('list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus parfum.');
    },
  });

  const resetForm = () => {
    setName('');
    setEdition('OM-07');
    setSlug('');
    setFamily('Woody');
    setTagline('');
    setDescription('');
    setPrice('2450000');
    setVolume('50 ml');
    setConcentration('Extrait de parfum, 20%');
    setStockCount('24');
    setIsAvailable(true);
    setBottleImage('/images/bottle-vetiver.jpg');
    setMacroImage('/images/macro-vetiver.jpg');
    setNotesTop('');
    setNotesHeart('');
    setNotesBase('');
    setMaterialName('');
    setMaterialOrigin('');
    setMaterialPhrase('');
    setStory('');
    setQuoteText('');
    setQuoteAttribution('');
    setMaceration('Enam minggu');
    setLongevity('8 sampai 10 jam');
    setSillage('Sejauh lengan');
  };

  const populateForm = (p: any) => {
    setName(p.name || '');
    setEdition(p.edition || '');
    setSlug(p.slug || '');
    setFamily(p.family || 'Woody');
    setTagline(p.tagline || '');
    setDescription(p.description || '');
    setPrice(String(p.price || '2450000'));
    setVolume(p.volume || '50 ml');
    setConcentration(p.concentration || 'Extrait de parfum, 20%');
    setStockCount(String(p.stockCount ?? 24));
    setIsAvailable(p.isAvailable ?? true);
    setBottleImage((p.bottleImage || '/images/bottle-vetiver.jpg').replace(/^\/src\/assets\/images\//, '/images/'));
    setMacroImage((p.macroImage || '/images/macro-vetiver.jpg').replace(/^\/src\/assets\/images\//, '/images/'));

    // Notes
    const n = p.notes || {};
    setNotesTop((n.top || []).join(', '));
    setNotesHeart((n.heart || []).join(', '));
    setNotesBase((n.base || []).join(', '));

    // Material
    const m = p.material || {};
    setMaterialName(m.name || '');
    setMaterialOrigin(m.origin || '');
    setMaterialPhrase(m.phrase || '');

    // Story
    if (Array.isArray(p.story)) {
      setStory(p.story.join('\n\n'));
    } else if (typeof p.story === 'string') {
      setStory(p.story);
    } else {
      setStory('');
    }

    // Quote
    const q = p.quote || {};
    setQuoteText(q.text || '');
    setQuoteAttribution(q.attribution || '');

    // Performance
    const perf = p.performance || {};
    setMaceration(perf.maceration || 'Enam minggu');
    setLongevity(perf.longevity || '8 sampai 10 jam');
    setSillage(perf.sillage || 'Sejauh lengan');
  };

  const handleOpenAdd = () => {
    resetForm();
    setCurrentView('create');
  };

  const handleOpenEdit = (p: any) => {
    setSelectedPerfume(p);
    populateForm(p);
    setCurrentView('edit');
  };

  const handleOpenDetail = (p: any) => {
    setSelectedPerfume(p);
    setCurrentView('detail');
  };

  const handleOpenDelete = (p: any) => {
    setPerfumeToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const buildPayload = () => {
    const parseList = (str: string) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const storyParagraphs = story
      .split('\n\n')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      name: name.trim(),
      edition: edition.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
      family,
      tagline: tagline.trim(),
      description: description.trim(),
      price: Number(price),
      volume: volume.trim(),
      concentration: concentration.trim(),
      stockCount: Number(stockCount),
      isAvailable,
      bottleImage,
      bottleAlt: `Flacon wewangian OMOO ${name}`,
      macroImage,
      macroAlt: `Makro bahan alami wewangian ${name}`,
      notes: {
        top: parseList(notesTop),
        heart: parseList(notesHeart),
        base: parseList(notesBase),
      },
      material: {
        name: materialName.trim(),
        origin: materialOrigin.trim(),
        phrase: materialPhrase.trim(),
      },
      story: storyParagraphs.length > 0 ? storyParagraphs : [story.trim()],
      quote: {
        text: quoteText.trim(),
        attribution: quoteAttribution.trim(),
      },
      performance: {
        concentration,
        maceration,
        longevity,
        sillage,
      },
    };
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();

    if (currentView === 'create') {
      createMutation.mutate(payload);
    } else if (currentView === 'edit' && selectedPerfume) {
      updateMutation.mutate({ id: selectedPerfume.id, data: payload });
    }
  };

  // ---------------------------------------------------------------------------
  // SUB-VIEW 1: FORM HALAMAN PENUH (CREATE & EDIT)
  // ---------------------------------------------------------------------------
  if (currentView === 'create' || currentView === 'edit') {
    const isEdit = currentView === 'edit';

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Parfum</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted uppercase tracking-wider">
              {isEdit ? `Mengedit: ${selectedPerfume?.name}` : 'Menambah Parfum Baru'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-8 max-w-5xl">
          {/* SECTION 1: Identitas & Klasifikasi */}
          <div className="border border-line bg-surface/20 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-display text-lg text-ink font-normal">
                1. Identitas & Klasifikasi Wewangian
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Nama Parfum"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Vetiver Obscura"
                required
              />
              <Input
                label="Nomor Edisi Flacon"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="Contoh: OM-01"
                required
              />
              <Input
                label="Slug URL Produk"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Contoh: vetiver-obscura"
                helperText="URL di website: /collection/slug"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block mb-1.5">
                  Keluarga Aroma (Family)
                </label>
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  className="w-full bg-surface border border-line px-3 py-2 text-xs text-ink focus:border-ink outline-none"
                >
                  <option value="Woody">Woody</option>
                  <option value="Floral">Floral</option>
                  <option value="Green">Green</option>
                  <option value="Fresh">Fresh</option>
                  <option value="Oriental">Oriental</option>
                  <option value="Musk">Musk</option>
                </select>
              </div>

              <Input
                label="Tagline Puitis (Deck)"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Contoh: Vetiver, smoke, cold citrus."
                required
              />
            </div>

            <Textarea
              label="Deskripsi Lengkap Produk"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Akar vetiver yang lembap, dipotong dingin oleh grapefruit..."
              rows={3}
              required
            />
          </div>

          {/* SECTION 2: Harga, Stok & Ketersediaan */}
          <div className="border border-line bg-surface/20 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Layers className="w-4 h-4 text-accent" />
              <h3 className="font-display text-lg text-ink font-normal">
                2. Harga, Spesifikasi & Status Ketersediaan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Harga Flacon (IDR)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2450000"
                required
              />
              <Input
                label="Ukuran Volume"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="50 ml"
                required
              />
              <Input
                label="Konsentrasi Extrait"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                placeholder="Extrait de parfum, 20%"
              />
              <Input
                label="Jumlah Stok Botol"
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="24"
              />
            </div>

            {/* Toggle Status Stok */}
            <div className="flex items-center justify-between p-3.5 bg-surface/40 border border-line">
              <div>
                <span className="text-xs font-semibold text-ink block">
                  Status Ketersediaan di Toko:
                </span>
                <span className="text-[0.68rem] text-muted">
                  Bila status Habis, tombol beli di halaman produk otomatis dinonaktifkan.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                  isAvailable
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/40 text-red-600'
                }`}
              >
                {isAvailable ? '✓ Tersedia (In Stock)' : '✕ Stok Habis (Sold Out)'}
              </button>
            </div>
          </div>

          {/* SECTION 3: Unggah Foto Botol & Makro Langsung */}
          <div className="border border-line bg-surface/20 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <ImageIcon className="w-4 h-4 text-accent" />
              <h3 className="font-display text-lg text-ink font-normal">
                3. Unggah Foto Botol Parfum & Makro (File Upload)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bottle Image Upload */}
              <div className="space-y-3">
                <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                  Foto Botol Utama (Bottle Image)
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start p-4 border border-line bg-surface/30">
                  <div className="w-24 h-28 border border-line bg-surface overflow-hidden shrink-0 flex items-center justify-center relative group">
                    {bottleImage ? (
                      <>
                        <img src={bottleImage} alt="Preview Botol" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBottleImage('')}
                          className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[0.6rem] text-muted text-center px-1">Belum ada foto</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-ink text-bg text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-ink/90 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      <span>{isUploadingBottle ? 'Mengunggah...' : 'Pilih Berkas Foto Botol'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingBottle}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'bottle');
                        }}
                      />
                    </label>
                    <p className="text-[0.62rem] text-muted">
                      Unggah langsung dari komputer (JPG, PNG, WEBP).
                    </p>

                    <div className="pt-2 border-t border-line/50">
                      <span className="text-[0.58rem] uppercase tracking-wider text-muted block mb-1">
                        Atau pilih dari preset botol:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {presetBottlePhotos.map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setBottleImage(p.url)}
                            className="px-1.5 py-0.5 text-[0.58rem] uppercase tracking-wider border border-line hover:border-ink transition-colors bg-surface/40 cursor-pointer"
                          >
                            {p.label.replace('Botol ', '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Macro Image Upload */}
              <div className="space-y-3">
                <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                  Foto Makro Bahan Mentah (Macro Image)
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start p-4 border border-line bg-surface/30">
                  <div className="w-24 h-28 border border-line bg-surface overflow-hidden shrink-0 flex items-center justify-center relative group">
                    {macroImage ? (
                      <>
                        <img src={macroImage} alt="Preview Makro" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMacroImage('')}
                          className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[0.6rem] text-muted text-center px-1">Belum ada foto</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-ink text-bg text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-ink/90 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      <span>{isUploadingMacro ? 'Mengunggah...' : 'Pilih Berkas Foto Makro'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingMacro}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'macro');
                        }}
                      />
                    </label>
                    <p className="text-[0.62rem] text-muted">
                      Unggah langsung dari komputer (JPG, PNG, WEBP).
                    </p>

                    <div className="pt-2 border-t border-line/50">
                      <span className="text-[0.58rem] uppercase tracking-wider text-muted block mb-1">
                        Atau pilih dari preset makro:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {presetMacroPhotos.map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setMacroImage(p.url)}
                            className="px-1.5 py-0.5 text-[0.58rem] uppercase tracking-wider border border-line hover:border-ink transition-colors bg-surface/40 cursor-pointer"
                          >
                            {p.label.replace('Makro ', '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Piramida Komposisi Aroma (Notes) */}
          <div className="border border-line bg-surface/20 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <FileText className="w-4 h-4 text-accent" />
              <h3 className="font-display text-lg text-ink font-normal">
                4. Piramida Komposisi Aroma (Notes)
              </h3>
            </div>

            <p className="text-[0.68rem] text-muted">
              Masukkan aroma dipisahkan dengan tanda koma (contoh: <code>Grapefruit peel, Pink pepper</code>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Top Notes (Aroma Pembuka)"
                value={notesTop}
                onChange={(e) => setNotesTop(e.target.value)}
                placeholder="Grapefruit peel, Pink pepper"
              />
              <Input
                label="Heart Notes (Aroma Tengah)"
                value={notesHeart}
                onChange={(e) => setNotesHeart(e.target.value)}
                placeholder="Haitian vetiver, Orris root"
              />
              <Input
                label="Base Notes (Aroma Dasar)"
                value={notesBase}
                onChange={(e) => setNotesBase(e.target.value)}
                placeholder="Cedar, Ambrette, Incense"
              />
            </div>
          </div>

          {/* SECTION 5: On Skin & Performa Teknis */}
          <div className="border border-line bg-surface/20 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="font-display text-lg text-ink font-normal">
                5. On Skin & Performa Teknis
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teks Kutipan Filosofis (Quote)"
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Saya ingin vetiver yang berbau seperti ladang, bukan botol."
              />
              <Input
                label="Atribusi / Nama Perfumer"
                value={quoteAttribution}
                onChange={(e) => setQuoteAttribution(e.target.value)}
                placeholder="Camille Aumont, perfumer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Input
                label="Durasi Maserasi"
                value={maceration}
                onChange={(e) => setMaceration(e.target.value)}
                placeholder="Enam minggu"
              />
              <Input
                label="Ketahanan Aroma (Longevity)"
                value={longevity}
                onChange={(e) => setLongevity(e.target.value)}
                placeholder="8 sampai 10 jam"
              />
              <Input
                label="Jejak Aroma (Sillage)"
                value={sillage}
                onChange={(e) => setSillage(e.target.value)}
                placeholder="Sejauh lengan"
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentView('list')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={<Save className="w-4 h-4" />}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? 'Simpan Perubahan Parfum' : 'Tambahkan Parfum ke Katalog'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-VIEW 2: HALAMAN DETAIL PARFUM LENGKAP
  // ---------------------------------------------------------------------------
  if (currentView === 'detail' && selectedPerfume) {
    const p = selectedPerfume;
    const notes = p.notes || {};
    const mat = p.material || {};
    const quote = p.quote || {};
    const perf = p.performance || {};
    const storyList = Array.isArray(p.story) ? p.story : [p.story || ''];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Parfum</span>
          </button>

          <div className="flex items-center gap-3">
            <a
              href={`/collection/${p.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-semibold border border-line bg-surface/30 hover:border-ink transition-colors"
            >
              <span>Lihat di Web Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Button
              variant="primary"
              size="sm"
              icon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => handleOpenEdit(p)}
            >
              Edit Parfum
            </Button>
          </div>
        </div>

        {/* Hero Product Detail Card */}
        <div className="border border-line bg-surface/20 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Photos */}
            <div className="md:col-span-5 space-y-4">
              <div className="aspect-[4/5] border border-line bg-surface overflow-hidden">
                <img
                  src={resolvePublicImageUrl(p.bottleImage)}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {p.macroImage && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square border border-line bg-surface overflow-hidden">
                    <img
                      src={resolvePublicImageUrl(p.macroImage, '/images/macro-vetiver.jpg')}
                      alt="Makro Bahan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center border-t border-line pt-2 text-xs">
                    <span className="text-[0.6rem] uppercase tracking-wider text-muted">Bahan</span>
                    <span className="font-display text-base font-light italic mt-1">
                      {mat.phrase || 'Material alami'}
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted mt-1">
                      {mat.name}, {mat.origin}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Information */}
            <div className="md:col-span-7 space-y-5">
              <div>
                <span className="text-[0.65rem] uppercase font-semibold tracking-[0.14em] text-muted">
                  {p.edition} / {p.family}
                </span>
                <h2 className="font-display text-4xl text-ink font-light mt-1">
                  {p.name}
                </h2>
                <p className="font-display text-lg text-ink font-light italic mt-2">
                  {p.tagline}
                </p>
                <p className="text-xs text-muted leading-relaxed mt-3">
                  {p.description}
                </p>
              </div>

              <div className="flex items-baseline justify-between gap-4 border-y border-line py-3.5">
                <span className="font-mono text-2xl font-bold text-ink">
                  Rp {p.price?.toLocaleString('id-ID')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {p.volume} / {p.concentration}
                  </span>
                  <Badge variant={p.isAvailable ? 'available' : 'unavailable'}>
                    {p.isAvailable ? 'Tersedia' : 'Stok Habis'}
                  </Badge>
                </div>
              </div>

              {/* Composition Notes */}
              <div className="border border-line p-4 bg-surface/30 space-y-3">
                <span className="text-[0.62rem] uppercase font-semibold tracking-[0.12em] text-accent block">
                  Piramida Komposisi Aroma (Notes)
                </span>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[0.6rem] uppercase text-muted block">Top</span>
                    <span className="font-medium text-ink mt-0.5 block">
                      {(notes.top || []).join(', ') || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.6rem] uppercase text-muted block">Heart</span>
                    <span className="font-medium text-ink mt-0.5 block">
                      {(notes.heart || []).join(', ') || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.6rem] uppercase text-muted block">Base</span>
                    <span className="font-medium text-ink mt-0.5 block">
                      {(notes.base || []).join(', ') || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Perfumer Quote */}
              {quote.text && (
                <div className="border-l-2 border-accent pl-4 py-1 italic text-xs font-display text-ink">
                  "{quote.text}"
                  <span className="block not-italic text-[0.65rem] text-muted uppercase font-sans mt-1">
                    &mdash; {quote.attribution}
                  </span>
                </div>
              )}

              {/* Performance Specs */}
              <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
                <div>
                  <span className="text-[0.6rem] uppercase text-muted block">Maceration</span>
                  <span className="text-ink font-medium">{perf.maceration || '-'}</span>
                </div>
                <div>
                  <span className="text-[0.6rem] uppercase text-muted block">Longevity</span>
                  <span className="text-ink font-medium">{perf.longevity || '-'}</span>
                </div>
                <div>
                  <span className="text-[0.6rem] uppercase text-muted block">Sillage</span>
                  <span className="text-ink font-medium">{perf.sillage || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MASTER VIEW: DAFTAR KATALOG PARFUM (TABLE & GRID VIEW)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h2 className="font-display text-2xl text-ink font-normal">
            Katalog Parfum & Flacon
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Kelola data produk, harga, formula lengkap, dan ubah status ketersediaan secara instan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Table vs Grid View Switcher */}
          <div className="flex items-center border border-line bg-surface/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-ink text-bg shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-ink text-bg shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenAdd}
          >
            Tambah Parfum Baru
          </Button>
        </div>
      </div>

      {/* Content Rendering: Loading / Empty / Grid / Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted">Memuat katalog wewangian...</div>
      ) : perfumes.length === 0 ? (
        <div className="border border-line bg-surface/10 p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-muted mx-auto opacity-40" />
          <p className="text-sm text-ink font-medium">Katalog parfum masih kosong</p>
          <Button variant="outline" onClick={handleOpenAdd}>
            Tambahkan Parfum Pertama
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ---------------- GRID CARD VIEW ---------------- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {perfumes.map((p: any) => (
            <div
              key={p.id}
              className="border border-line bg-surface/20 flex flex-col justify-between hover:border-ink transition-all group overflow-hidden"
            >
              {/* Card Image Header */}
              <div className="relative aspect-[4/5] bg-surface overflow-hidden border-b border-line">
                <img
                  src={resolvePublicImageUrl(p.bottleImage)}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Status Badge floating */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge variant={p.isAvailable ? 'available' : 'unavailable'}>
                    {p.isAvailable ? 'Tersedia' : 'Stok Habis'}
                  </Badge>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2 py-0.5 text-[0.62rem] font-mono font-bold bg-[#070906]/80 backdrop-blur-md text-bg border border-line">
                    {p.edition}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[0.62rem] uppercase font-semibold tracking-[0.12em] text-muted block">
                    {p.family} &bull; {p.volume}
                  </span>
                  <h3 className="font-display text-2xl text-ink font-normal mt-1">
                    {p.name}
                  </h3>
                  <p className="font-display text-sm text-ink font-light italic mt-1 line-clamp-1">
                    {p.tagline}
                  </p>
                  <p className="text-xs text-muted line-clamp-2 mt-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Price & Toggle */}
                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-ink">
                    Rp {p.price?.toLocaleString('id-ID')}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({ id: p.id, isAvailable: !p.isAvailable })
                    }
                    className={`px-2.5 py-1 text-[0.62rem] uppercase font-semibold tracking-wider border transition-colors cursor-pointer ${
                      p.isAvailable
                        ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10'
                        : 'border-red-500/40 text-red-600 hover:bg-red-500/10'
                    }`}
                    title="Klik untuk mengubah ketersediaan stok"
                  >
                    {p.isAvailable ? 'Tersedia' : 'Habis'}
                  </button>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-surface/40 border-t border-line flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(p)}
                  className="flex items-center gap-1 text-[0.68rem] uppercase font-semibold tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-accent" />
                  <span>Detail</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 border border-line hover:border-ink text-ink transition-colors cursor-pointer"
                    title="Edit Data Parfum"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(p)}
                    className="p-1.5 border border-line hover:border-red-600 text-red-600 transition-colors cursor-pointer"
                    title="Hapus Parfum"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ---------------- TABLE VIEW ---------------- */
        <div className="border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/40 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted">
                  <th className="p-3.5">Flacon & Edisi</th>
                  <th className="p-3.5">Nama & Tagline</th>
                  <th className="p-3.5">Keluarga Aroma</th>
                  <th className="p-3.5">Harga</th>
                  <th className="p-3.5">Status Stok</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {perfumes.map((p: any) => (
                  <tr key={p.id} className="hover:bg-surface/25 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 border border-line bg-surface overflow-hidden shrink-0">
                          <img
                            src={resolvePublicImageUrl(p.bottleImage)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-ink">
                          {p.edition}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-ink text-sm">{p.name}</p>
                      <p className="text-[0.68rem] text-muted italic font-display">{p.tagline}</p>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 text-[0.6rem] uppercase tracking-wider font-medium bg-surface/50 border border-line">
                        {p.family}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono font-medium text-ink">
                      Rp {p.price?.toLocaleString('id-ID')}
                    </td>

                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          toggleMutation.mutate({ id: p.id, isAvailable: !p.isAvailable })
                        }
                        className={`px-3 py-1 text-[0.65rem] uppercase font-semibold tracking-wider border transition-colors cursor-pointer ${
                          p.isAvailable
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-500/10 border-red-500/40 text-red-600'
                        }`}
                      >
                        {p.isAvailable ? 'Tersedia' : 'Habis'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(p)}
                          className="p-1.5 border border-line hover:border-ink transition-colors cursor-pointer"
                          title="Lihat Detail Parfum"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 border border-line hover:border-ink transition-colors cursor-pointer"
                          title="Edit Parfum"
                        >
                          <Edit className="w-3.5 h-3.5 text-ink" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(p)}
                          className="p-1.5 border border-line hover:border-red-600 transition-colors cursor-pointer"
                          title="Hapus Parfum"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DELETE MODAL (NOT BROWSER ALERT) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Parfum"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 border border-red-500/30 bg-red-500/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-ink">
                Yakin ingin menghapus parfum "{perfumeToDelete?.name}" ({perfumeToDelete?.edition})?
              </p>
              <p className="text-muted leading-relaxed">
                Produk ini akan dihapus permanen dari basis data katalog dan tidak lagi muncul di halaman koleksi toko.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-red-600 text-white hover:bg-red-700 border-red-700"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (perfumeToDelete) {
                  deleteMutation.mutate(perfumeToDelete.id);
                }
              }}
            >
              Ya, Hapus Parfum
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
