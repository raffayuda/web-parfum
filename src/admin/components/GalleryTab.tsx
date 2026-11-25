import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { resolvePublicImageUrl } from '../../data/images';
import { Button } from '../../components/ui/react/Button';
import { Input, Textarea } from '../../components/ui/react/Input';
import { Modal } from '../../components/ui/react/Modal';
import {
  Plus,
  Edit3,
  Trash2,
  Upload,
  Camera,
  MapPin,
  Calendar,
  Star,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_OPTIONS = [
  'Dokumentasi Pembuatan',
  'Event & Collab',
  'Pop-Up & Showcase',
  'Behind the Scenes',
  'Material & Botol',
];

const ASPECT_OPTIONS = [
  { value: '4 / 5', label: 'Portrait (4 : 5)' },
  { value: '16 / 10', label: 'Landscape (16 : 10)' },
  { value: '1 / 1', label: 'Square (1 : 1)' },
];

const PRESET_IMAGES = [
  { label: 'Ruang Maserasi', url: '/images/atelier.jpg' },
  { label: 'Koridor Studio', url: '/images/corridor.jpg' },
  { label: 'Botol Vetiver', url: '/images/bottle-vetiver.jpg' },
  { label: 'Botol Sel Marin', url: '/images/bottle-sel.jpg' },
  { label: 'Botol Iris Cendre', url: '/images/bottle-iris.jpg' },
  { label: 'Akar Vetiver', url: '/images/macro-vetiver.jpg' },
  { label: 'Kayu Gaharu', url: '/images/macro-oud.jpg' },
];

interface GalleryFormState {
  title: string;
  category: string;
  eventOrLocation: string;
  capturedDate: string;
  image: string;
  description: string;
  aspect: string;
  featured: boolean;
}

const emptyForm: GalleryFormState = {
  title: '',
  category: 'Dokumentasi Pembuatan',
  eventOrLocation: 'Jakarta',
  capturedDate: '',
  image: '/images/atelier.jpg',
  description: '',
  aspect: '4 / 5',
  featured: false,
};

export const GalleryTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<GalleryFormState>(emptyForm);
  const [isUploading, setIsUploading] = useState(false);

  const { data: galleryRes, isLoading, refetch } = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: () => api.getGallery(),
  });

  const items: any[] = galleryRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: GalleryFormState) => api.createGalleryItem(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Foto dokumentasi berhasil ditambahkan.');
        queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
        setIsModalOpen(false);
      } else {
        toast.error(res.message || 'Gagal menambahkan foto.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GalleryFormState }) =>
      api.updateGalleryItem(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Dokumentasi galeri berhasil diperbarui.');
        queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
        setIsModalOpen(false);
      } else {
        toast.error(res.message || 'Gagal memperbarui dokumentasi.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteGalleryItem(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Foto galeri berhasil dihapus.');
        queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      } else {
        toast.error(res.message || 'Gagal menghapus foto.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      capturedDate: new Date().toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      }),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'Dokumentasi Pembuatan',
      eventOrLocation: item.eventOrLocation || '',
      capturedDate: item.capturedDate || '',
      image: item.image || '/images/atelier.jpg',
      description: item.description || '',
      aspect: item.aspect || '4 / 5',
      featured: Boolean(item.featured),
    });
    setIsModalOpen(true);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadFile(file, 'gallery');
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image: res.url }));
        toast.success('Foto berhasil diunggah.');
      } else {
        toast.error(res.message || 'Gagal mengunggah foto.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image.trim()) {
      toast.error('Judul dan URL / unggahan foto wajib diisi.');
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted text-xs uppercase tracking-[0.1em]">
        Memuat daftar foto galeri...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h3 className="font-display text-2xl font-light text-ink">
            Galeri & Dokumentasi ({items.length})
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Kelola foto event kolaborasi, dokumentasi pembuatan, dan momen di balik OMOO. Klik foto
            di halaman publik akan menampilkan detail cerita ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-line bg-surface/40 hover:bg-surface text-xs uppercase tracking-wider text-ink transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted" />
            <span>Segarkan</span>
          </button>

          <Button
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4 text-accent" />}
          >
            Tambah Foto Galeri
          </Button>
        </div>
      </div>

      {/* Gallery Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-line bg-surface/20 p-4 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-line bg-surface">
                  <img
                    src={resolvePublicImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-bg/90 border border-line text-[0.58rem] font-semibold uppercase tracking-wider text-ink">
                    {item.category}
                  </span>
                  {item.featured && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 bg-accent-fill/90 border border-accent text-[0.58rem] font-semibold uppercase tracking-wider text-ink">
                      <Star className="w-2.5 h-2.5" />
                      <span>Beranda</span>
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-display text-lg text-ink font-normal leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[0.65rem] text-muted mt-1">
                    {item.eventOrLocation && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-accent" />
                        <span>{item.eventOrLocation}</span>
                      </span>
                    )}
                    {item.capturedDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-accent" />
                        <span>{item.capturedDate}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted line-clamp-2 mt-2 leading-relaxed">
                    {item.description || 'Belum ada keterangan dokumentasi.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line/70">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="inline-flex items-center justify-center w-9 h-9 border border-line bg-surface/40 hover:border-accent hover:bg-surface text-ink transition-colors cursor-pointer"
                  title="Edit Foto"
                  aria-label="Edit Foto"
                >
                  <Edit3 className="w-4 h-4 text-accent" />
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Hapus foto "${item.title}" dari galeri?`)) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  className="inline-flex items-center justify-center w-9 h-9 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500 text-red-600 dark:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                  title="Hapus Foto"
                  aria-label="Hapus Foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-line bg-surface/20 p-12 text-center space-y-3">
          <Camera className="w-8 h-8 text-muted mx-auto" />
          <p className="text-xs uppercase tracking-[0.12em] text-muted">
            Belum ada foto dokumentasi di galeri.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Foto Dokumentasi' : 'Tambah Foto Galeri'}
        subtitle="Foto yang ditambahkan akan langsung muncul di halaman /gallery"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Image Preview & Upload */}
            <div className="md:col-span-5 space-y-3">
              <div className="aspect-[4/3] w-full border border-line bg-surface overflow-hidden">
                <img
                  src={resolvePublicImageUrl(formData.image)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <label className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-line bg-surface/50 hover:border-ink text-xs font-semibold uppercase tracking-wider text-ink transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-accent" />
                <span>{isUploading ? 'Mengunggah...' : 'Unggah Foto Baru'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <div className="space-y-1.5">
                <span className="text-[0.62rem] uppercase tracking-wider text-muted font-semibold block">
                  Atau pilih foto studio:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                      className={`px-2 py-1 text-[0.6rem] border transition-colors cursor-pointer ${
                        formData.image === preset.url
                          ? 'border-ink bg-ink text-bg'
                          : 'border-line bg-bg text-muted hover:text-ink'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="md:col-span-7 space-y-3.5">
              <Input
                label="Judul Dokumentasi *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Pop-up Showcase Jakarta Selatan"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-muted font-medium mb-1.5">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface/40 border border-line px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-ink"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Waktu / Bulan"
                  value={formData.capturedDate}
                  onChange={(e) => setFormData({ ...formData, capturedDate: e.target.value })}
                  placeholder="Contoh: November 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Lokasi / Nama Event"
                  value={formData.eventOrLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, eventOrLocation: e.target.value })
                  }
                  placeholder="Contoh: Kemang, Jakarta Selatan"
                />

                <div>
                  <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-muted font-medium mb-1.5">
                    Rasio Foto
                  </label>
                  <select
                    value={formData.aspect}
                    onChange={(e) => setFormData({ ...formData, aspect: e.target.value })}
                    className="w-full bg-surface/40 border border-line px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-ink"
                  >
                    {ASPECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Textarea
                label="Cerita / Keterangan Foto"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Jelaskan cerita di balik foto ini (tampil dalam modal saat foto diklik pengunjung)..."
              />

              <label className="flex items-center gap-2.5 text-xs text-ink cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 accent-ink"
                />
                <span>Tampilkan pada bagian Gallery di Halaman Utama (Beranda)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingItem ? 'Simpan Perubahan' : 'Tambahkan ke Galeri'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
