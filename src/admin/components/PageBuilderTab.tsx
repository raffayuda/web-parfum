import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input, Textarea } from '../../components/ui/react/Input';
import { Modal } from '../../components/ui/react/Modal';
import { Badge } from '../../components/ui/react/Badge';
import { toast } from 'sonner';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Layout,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
  ShieldCheck,
  Check,
  ExternalLink,
  ArrowLeft,
  Save,
  AlertTriangle,
} from 'lucide-react';

interface TemplateOption {
  value: string;
  label: string;
  description: string;
  icon: any;
  defaultData: any;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    value: 'HERO_EDITORIAL',
    label: 'Hero Editorial',
    description: 'Headline tipografi besar mewah, eyebrow atelier, mist ambient blur, dan tombol CTA.',
    icon: Sparkles,
    defaultData: { ctaText: 'Explore Collection', ctaLink: '/collection' },
  },
  {
    value: 'HERO_SPLIT',
    label: 'Hero Split Media',
    description: 'Layout split 2-kolom: narasi di kiri dan foto atelier resolusi tinggi di kanan.',
    icon: Layout,
    defaultData: { imageUrl: '/src/assets/images/atelier.jpg', imageAlt: 'Atelier Omoo' },
  },
  {
    value: 'FRAGRANCE_GRID',
    label: 'Fragrance Grid Showcase',
    description: 'Katalog botol parfum live dengan filter keluarga aroma dan badge stok.',
    icon: Layers,
    defaultData: { limit: 6, showFilters: true },
  },
  {
    value: 'MATERIAL_STORY',
    label: 'Material Story (Atelier Origins)',
    description: 'Galeri bahan mentah alami (Vetiver Haiti, Iris Toscana, Gaharu) dengan foto makro.',
    icon: FileText,
    defaultData: {
      headline: 'Materials, satu per satu.',
      originQuote: 'Setiap botol berakar dari sebuah tempat spesifik di bumi.',
    },
  },
  {
    value: 'PROCESS_STEPS',
    label: 'Proses Peracikan 4-Tahap',
    description: 'Tahapan formulasi perlahan (Maserasi, Evaluasi Matang, Pembotolan Manual).',
    icon: HelpCircle,
    defaultData: {
      steps: [
        { num: '01', title: 'Pemilihan Material Asal', desc: 'Material dipanen pada musim terbaik.' },
        { num: '02', title: 'Maserasi Dingin Enam Minggu', desc: 'Dibiarkan diam dalam tangki kaca tebal.' },
        { num: '03', title: 'Evaluasi Tanpa Distorsi', desc: 'Diuji berkala pada kulit dan kertas serap.' },
        { num: '04', title: 'Flacon & Segel Tangan', desc: 'Dituang dalam botol kaca berat dan disegel lilin.' },
      ],
    },
  },
  {
    value: 'HALAL_BPOM_BADGE',
    label: 'Halal & BPOM Authenticity Seal',
    description: 'Komponen sertifikasi legalitas resmi dengan pemindai QR code Google Lens terverifikasi.',
    icon: ShieldCheck,
    defaultData: { showQrScanner: true, featuredCode: 'BPOM-OM01-VETIVER' },
  },
  {
    value: 'RICH_TEXT_MEDIA',
    label: 'Rich Text & Editorial Media',
    description: 'Blok narasi filosofi, quote kutipan perfumer, dan esai wewangian.',
    icon: FileText,
    defaultData: {
      paragraphs: ['Parfum adalah bentuk seni tak terlihat yang menetap di memori.'],
    },
  },
  {
    value: 'DISCOVERY_BANNER',
    label: 'Discovery Banner Set',
    description: 'Banner showcase kotak penemuan 6 x 2ml sampel wewangian.',
    icon: Layers,
    defaultData: { price: 450000, ctaText: 'Pesan Discovery Set' },
  },
];

export const PageBuilderTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPageSlug] = useState('home');

  // Sub-view router: 'list' | 'create' | 'edit' (NO MODAL)
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');

  // Custom Delete Confirmation Modal state (NO BROWSER ALERT)
  const [sectionToDelete, setSectionToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states for Add / Edit
  const [editingSection, setEditingSection] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formTemplate, setFormTemplate] = useState('HERO_EDITORIAL');
  const [formTitle, setFormTitle] = useState('');
  const [formEyebrow, setFormEyebrow] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formContentJson, setFormContentJson] = useState('{}');
  const [contentFields, setContentFields] = useState<Record<string, any>>({});
  const [showRawJson, setShowRawJson] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (key: string, val: any) => {
    setContentFields((prev) => {
      const updated = { ...prev, [key]: val };
      setFormContentJson(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  // Queries
  const { data: currentPageData, isLoading } = useQuery({
    queryKey: ['admin-page', selectedPageSlug],
    queryFn: () => api.getPage(selectedPageSlug, true),
  });

  const currentPage = currentPageData?.data;
  const sections = currentPage?.sections || [];

  // Mutations
  const addSectionMutation = useMutation({
    mutationFn: (data: any) => api.addSection(currentPage.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page', selectedPageSlug] });
      toast.success('Seksi baru berhasil ditambahkan!');
      setCurrentView('list');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menambahkan seksi.');
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page', selectedPageSlug] });
      toast.success('Seksi berhasil diperbarui!');
      setCurrentView('list');
      setEditingSection(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui seksi.');
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => api.deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page', selectedPageSlug] });
      toast.success('Seksi berhasil dihapus dari halaman!');
      setIsDeleteModalOpen(false);
      setSectionToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus seksi.');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (newSections: any[]) =>
      api.reorderSections(
        newSections.map((s, idx) => ({ id: s.id, order: idx }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page', selectedPageSlug] });
      toast.success('Urutan seksi berhasil diperbarui!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui urutan.');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormTemplate('HERO_EDITORIAL');
    setFormTitle('');
    setFormEyebrow('');
    setFormSubtitle('');
    const defaultData = TEMPLATE_OPTIONS[0].defaultData;
    setContentFields(defaultData);
    setFormContentJson(JSON.stringify(defaultData, null, 2));
    setShowRawJson(false);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingSection(null);
    setCurrentView('create');
  };

  const handleOpenEdit = (section: any) => {
    setEditingSection(section);
    setFormName(section.name);
    setFormTemplate(section.template);
    setFormTitle(section.title || '');
    setFormEyebrow(section.eyebrow || '');
    setFormSubtitle(section.subtitle || '');
    const data = section.contentData || {};
    setContentFields(data);
    setFormContentJson(JSON.stringify(data, null, 2));
    setShowRawJson(false);
    setFormError(null);
    setCurrentView('edit');
  };

  const handleTemplateSelect = (templateValue: string) => {
    setFormTemplate(templateValue);
    const tmpl = TEMPLATE_OPTIONS.find((t) => t.value === templateValue);
    if (tmpl) {
      setContentFields(tmpl.defaultData);
      setFormContentJson(JSON.stringify(tmpl.defaultData, null, 2));
    }
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama seksi wajib diisi.');
      return;
    }

    let parsedContent = contentFields;
    if (showRawJson) {
      try {
        parsedContent = JSON.parse(formContentJson);
      } catch {
        setFormError('Format JSON tidak valid.');
        return;
      }
    }

    const payload = {
      name: formName.trim(),
      template: formTemplate,
      title: formTitle.trim(),
      eyebrow: formEyebrow.trim(),
      subtitle: formSubtitle.trim(),
      contentData: parsedContent,
    };

    if (currentView === 'edit' && editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data: payload });
    } else {
      addSectionMutation.mutate(payload);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    reorderMutation.mutate(newSections);
  };

  const handleToggleActive = (section: any) => {
    updateSectionMutation.mutate({
      id: section.id,
      data: { isActive: !section.isActive },
    });
  };

  const renderTemplateFields = () => {
    switch (formTemplate) {
      case 'HERO_EDITORIAL':
        return (
          <div className="space-y-4 p-5 bg-surface/30 border border-line">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
              Bidang Khusus Hero Editorial
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teks Tombol Utama"
                value={contentFields.ctaText || ''}
                onChange={(e) => updateField('ctaText', e.target.value)}
                placeholder="Explore the collection"
              />
              <Input
                label="Link Tombol Utama"
                value={contentFields.ctaLink || ''}
                onChange={(e) => updateField('ctaLink', e.target.value)}
                placeholder="/collection"
              />
            </div>
          </div>
        );

      case 'HERO_SPLIT':
        return (
          <div className="space-y-4 p-5 bg-surface/30 border border-line">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
              Bidang Khusus Hero Split
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Path / URL Foto Atelier"
                value={contentFields.imageUrl || ''}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="/src/assets/images/atelier.jpg"
              />
              <Input
                label="Alt Text Foto"
                value={contentFields.imageAlt || ''}
                onChange={(e) => updateField('imageAlt', e.target.value)}
                placeholder="Atelier Omoo Jakarta"
              />
            </div>
          </div>
        );

      case 'MATERIAL_STORY':
        return (
          <div className="space-y-4 p-5 bg-surface/30 border border-line">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
              Bidang Khusus Kisah Material
            </p>
            <Input
              label="Headline Material"
              value={contentFields.headline || ''}
              onChange={(e) => updateField('headline', e.target.value)}
              placeholder="Materials, satu per satu."
            />
            <Textarea
              label="Kutipan Filosofi Asal Material"
              value={contentFields.originQuote || ''}
              onChange={(e) => updateField('originQuote', e.target.value)}
              placeholder="Setiap botol berakar dari sebuah tempat spesifik di bumi."
            />
          </div>
        );

      case 'DISCOVERY_BANNER':
        return (
          <div className="space-y-4 p-5 bg-surface/30 border border-line">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
              Bidang Khusus Discovery Set
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Harga Discovery Set (IDR)"
                type="number"
                value={contentFields.price || 450000}
                onChange={(e) => updateField('price', Number(e.target.value))}
                placeholder="450000"
              />
              <Input
                label="Teks Tombol Aksi"
                value={contentFields.ctaText || ''}
                onChange={(e) => updateField('ctaText', e.target.value)}
                placeholder="Pesan Discovery Set"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // SUB-VIEW: CREATE / EDIT SECTION (FULL PAGE, NOT MODAL)
  if (currentView === 'create' || currentView === 'edit') {
    const isEdit = currentView === 'edit';
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('list')}
              className="p-2 border border-line hover:border-ink transition-colors text-muted hover:text-ink cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[0.62rem] uppercase font-semibold tracking-[0.14em] text-muted">
                {isEdit ? 'Formulir Pembaruan Seksi' : 'Formulir Tambah Seksi Baru'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-ink font-normal">
                {isEdit ? `Edit: ${formName || 'Seksi'}` : 'Tambah Seksi Baru ke Landing Page'}
              </h2>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('list')}
          >
            ← Kembali ke Layout & Seksi
          </Button>
        </div>

        {/* Edit / Create Form */}
        <form onSubmit={handleSubmitSave} className="space-y-6">
          {/* Section Info Card */}
          <div className="border border-line bg-surface/20 p-6 space-y-4">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-ink border-b border-line pb-2">
              1. Identitas & Judul Seksi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Internal Seksi *"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="cth. Hero Editorial, Katalog Showcase"
                required
              />
              <Input
                label="Eyebrow (Label Atas Kecil)"
                value={formEyebrow}
                onChange={(e) => setFormEyebrow(e.target.value)}
                placeholder="cth. MAISON DE PARFUM, JAKARTA"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Judul Utama Seksi (Title)"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="cth. Wear what cannot be seen."
              />
              <Input
                label="Sub-judul / Deskripsi Seksi"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="cth. Enam komposisi extrait de parfum, dibuat perlahan."
              />
            </div>
          </div>

          {/* Template Selection Card */}
          <div className="border border-line bg-surface/20 p-6 space-y-4">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-ink border-b border-line pb-2">
              2. Pilih Template Layout UI
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_OPTIONS.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = formTemplate === tmpl.value;
                return (
                  <div
                    key={tmpl.value}
                    onClick={() => handleTemplateSelect(tmpl.value)}
                    className={`p-4 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-ink bg-surface shadow-sm'
                        : 'border-line bg-surface/10 hover:border-ink/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-accent" />
                        <span className="text-xs font-semibold text-ink">{tmpl.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="mt-1 text-[0.68rem] text-muted leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Template Content Fields */}
          {renderTemplateFields()}

          {/* Error Notice */}
          {formError && (
            <div className="p-3 bg-red-950/20 border border-red-800/40 text-red-500 text-xs">
              {formError}
            </div>
          )}

          {/* Bottom Save Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentView('list')}
            >
              Batalkan
            </Button>

            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              isLoading={addSectionMutation.isPending || updateSectionMutation.isPending}
            >
              {isEdit ? 'Simpan Perubahan Seksi' : 'Tambahkan Seksi ke Landing Page'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // SUB-VIEW: LIST VIEW (MAIN DASHBOARD VIEW)
  return (
    <div className="space-y-6">
      {/* Visual Live Editor Direct Action Hub */}
      <div className="border border-line bg-surface/30 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-[0.62rem] uppercase font-bold tracking-[0.15em] text-accent">
              WYSIWYG Inline Visual Editor
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-ink font-normal">
            Editor Visual Langsung Landing Page
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            Sorot kursor langsung di atas teks landing page untuk mengetik dan mengubah kalimat secara real-time, atau klik tombol foto untuk mengganti foto wewangian dan atelier langsung di website publik.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <a
            href="/?edit=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-ink text-bg hover:bg-ink/90 font-semibold text-xs uppercase tracking-[0.1em] transition-all shadow-xl"
          >
            <Edit className="w-4 h-4 text-accent" />
            <span>Buka Visual Live Editor di Landing Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted ml-1" />
          </a>

          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenAdd}
          >
            + Tambah Seksi Baru
          </Button>
        </div>
      </div>

      {/* Sections List Header */}
      {currentPage && (
        <div className="border border-line bg-surface/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[0.62rem] uppercase font-semibold tracking-[0.14em] text-muted">
                Susunan Seksi Landing Page
              </span>
              <h3 className="font-display text-xl text-ink font-normal">
                {sections.length} Seksi Terdaftar di Database PostgreSQL
              </h3>
            </div>
            <a
              href="/?edit=true"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent underline hover:text-ink flex items-center gap-1 uppercase tracking-wider font-semibold"
            >
              <span>Edit Langsung di Website Publik</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Sections List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted">Memuat daftar seksi halaman...</div>
      ) : sections.length === 0 ? (
        <div className="border-2 border-dashed border-line p-12 text-center">
          <p className="text-sm font-medium text-ink">Belum ada seksi pada halaman ini.</p>
          <p className="text-xs text-muted mt-1">
            Klik tombol "Tambah Seksi Baru" untuk mulai menyusun layout halaman.
          </p>
          <Button size="sm" variant="primary" className="mt-4" onClick={handleOpenAdd}>
            Tambah Seksi Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((sec: any, index: number) => {
            return (
              <div
                key={sec.id}
                className={`border transition-all duration-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  sec.isActive ? 'border-line bg-surface/20' : 'border-line/40 bg-surface/5 opacity-60'
                }`}
              >
                {/* Left Section Info */}
                <div className="flex items-start gap-4">
                  {/* Order Number Badge */}
                  <span className="w-7 h-7 flex items-center justify-center font-display text-sm font-semibold border border-line bg-bg text-ink shrink-0">
                    {index + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
                        {sec.name}
                      </span>
                      <span className="px-2 py-0.5 text-[0.6rem] font-medium bg-accent-fill/20 border border-accent/30 text-ink">
                        {sec.template}
                      </span>
                      {!sec.isActive && (
                        <span className="px-2 py-0.5 text-[0.6rem] font-medium bg-muted/20 border border-muted/30 text-muted">
                          Nonaktif
                        </span>
                      )}
                    </div>

                    {sec.title && (
                      <p className="font-display text-lg text-ink font-light mt-1">
                        "{sec.title}"
                      </p>
                    )}
                    {sec.eyebrow && (
                      <p className="text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                        Eyebrow: {sec.eyebrow}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  {/* Reorder Buttons */}
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 border border-line hover:border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Pindahkan ke atas"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-ink" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-1.5 border border-line hover:border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Pindahkan ke bawah"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-ink" />
                  </button>

                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(sec)}
                    className="p-1.5 border border-line hover:border-ink transition-colors"
                    title={sec.isActive ? 'Sembunyikan seksi' : 'Aktifkan seksi'}
                  >
                    {sec.isActive ? (
                      <Eye className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-muted" />
                    )}
                  </button>

                  {/* Edit - Navigates to full sub-view */}
                  <button
                    onClick={() => handleOpenEdit(sec)}
                    className="p-1.5 border border-line hover:border-ink transition-colors"
                    title="Edit seksi"
                  >
                    <Edit className="w-3.5 h-3.5 text-ink" />
                  </button>

                  {/* Delete - Opens custom Modal (NO ALERT) */}
                  <button
                    onClick={() => {
                      setSectionToDelete(sec);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 border border-line hover:border-red-600 transition-colors"
                    title="Hapus seksi"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL (NO BROWSER ALERT) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Seksi"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-800/40 text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-red-200">
                Hapus Seksi "{sectionToDelete?.name}"?
              </p>
              <p className="text-muted leading-relaxed">
                Tindakan ini permanen. Seksi ini akan dihapus dari tata letak database dan tidak akan ditampilkan di website publik.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batalkan
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-red-700 hover:bg-red-600 text-white border-red-600"
              isLoading={deleteSectionMutation.isPending}
              onClick={() => {
                if (sectionToDelete?.id) {
                  deleteSectionMutation.mutate(sectionToDelete.id);
                }
              }}
            >
              Ya, Hapus Seksi Ini
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
