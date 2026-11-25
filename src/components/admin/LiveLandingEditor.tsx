import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../lib/api';
import { toast } from 'sonner';
import { Button } from '../ui/react/Button';
import { Input, Textarea } from '../ui/react/Input';
import {
  Edit3,
  X,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  FileText,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface LiveLandingEditorProps {
  initialSections?: any[];
  pageId?: string;
}

export const LiveLandingEditor: React.FC<LiveLandingEditorProps> = ({
  initialSections = [],
  pageId,
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sections, setSections] = useState<any[]>(initialSections);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form edit state for currently selected section
  const [editData, setEditData] = useState<any>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = () => {
      const adminSession = localStorage.getItem('omoo_admin_session');
      const cachedUser = localStorage.getItem('omoo_customer_user');
      let userRole = '';
      if (cachedUser) {
        try {
          userRole = JSON.parse(cachedUser).role;
        } catch {}
      }
      if (adminSession === 'active' || userRole === 'ADMIN') {
        setIsAdmin(true);
      }
    };
    checkAdmin();
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, []);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Login admin gagal');
      if (data?.user?.role !== 'ADMIN') throw new Error('Akun ini bukan akun Admin');

      localStorage.setItem('omoo_customer_user', JSON.stringify(data.user));
      localStorage.setItem('omoo_admin_session', 'active');
      setIsAdmin(true);
      setShowLoginModal(false);
      setIsOpen(true);
      refreshSections();
    } catch (err: any) {
      setLoginError(err.message || 'Login admin gagal.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fetch latest sections from DB
  const refreshSections = async () => {
    try {
      const res = await api.getPage('home', true);
      if (res.success && res.data?.sections) {
        setSections(res.data.sections);
      }
    } catch {}
  };

  const handleOpenSection = (sec: any) => {
    setActiveSectionId(sec.id);
    setEditData({
      eyebrow: sec.eyebrow || '',
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      isActive: sec.isActive,
      contentData: { ...(sec.contentData || {}) },
    });
    setSaveSuccess(false);
  };

  const handleSaveSection = async (secId: string) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        eyebrow: editData.eyebrow,
        title: editData.title,
        subtitle: editData.subtitle,
        isActive: editData.isActive,
        contentData: editData.contentData,
      };

      await api.updateSection(secId, payload);
      setSaveSuccess(true);
      toast.success('Perubahan konten landing page berhasil disimpan!');
      await refreshSections();

      // Soft reload after 600ms so user sees their changes live on the landing page immediately
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateContentField = (key: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      contentData: {
        ...(prev.contentData || {}),
        [key]: value,
      },
    }));
  };

  return (
    <>
      {/* Floating Trigger Pill on Landing Page */}
      <div className="fixed bottom-6 right-6 z-[99990] flex items-center gap-2">
        <button
          onClick={() => {
            if (isAdmin) {
              setIsOpen(true);
              refreshSections();
            } else {
              setShowLoginModal(true);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] border shadow-2xl transition-all cursor-pointer rounded-full ${
            isAdmin
              ? 'bg-ink text-bg border-line hover:bg-ink/90'
              : 'bg-surface text-ink border-accent/40 hover:border-accent'
          }`}
          title="Buka panel editor konten langsung di landing page"
        >
          <Edit3 className="w-4 h-4 text-accent" />
          <span>{isAdmin ? 'Mode Edit Landing Page' : 'Mode Edit (Admin)'}</span>
        </button>

        <a
          href="/admin"
          className="flex items-center justify-center w-9 h-9 bg-surface/90 text-ink border border-line rounded-full shadow-lg hover:border-ink transition-colors"
          title="Buka Dashboard Admin Lengkap"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Quick Admin Login Modal if not logged in */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#070906]/70 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative w-full max-w-sm bg-bg border border-line p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div>
                <h4 className="font-display text-lg text-ink font-normal">Autentikasi Admin</h4>
                <p className="text-[0.62rem] text-muted uppercase tracking-wider">
                  Masuk untuk mengedit konten landing page
                </p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickLogin} className="space-y-4">
              <Input
                label="Email Admin"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
              <Input
                label="Password Admin"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />

              {loginError && <p className="text-xs text-red-600">{loginError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowLoginModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoggingIn}>
                  Masuk & Edit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[99995] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#070906]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-xl bg-bg border-l border-line shadow-[0_0_80px_rgba(0,0,0,0.6)] h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="font-display text-xl text-ink font-normal">
                    Editor Konten Landing Page
                  </h3>
                  <p className="text-[0.65rem] text-muted uppercase tracking-wider">
                    Ubah teks dan konten seksi secara langsung
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted hover:text-ink transition-colors cursor-pointer"
                aria-label="Tutup editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: Sections Accordion */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3 bg-surface/40 border border-line text-xs text-muted leading-relaxed">
                Pilih seksi yang ingin Anda ubah di bawah ini. Semua kolom telah disesuaikan 100% dengan teks yang tampil di landing page saat ini. Klik <strong>Simpan Perubahan</strong> untuk langsung memperbarui tampilan web.
              </div>

              {sections.map((sec, idx) => {
                const isExpanded = activeSectionId === sec.id;

                return (
                  <div
                    key={sec.id}
                    className={`border transition-colors ${
                      isExpanded ? 'border-accent bg-surface/20' : 'border-line bg-surface/10'
                    }`}
                  >
                    {/* Section Header Button */}
                    <button
                      type="button"
                      onClick={() =>
                        isExpanded ? setActiveSectionId(null) : handleOpenSection(sec)
                      }
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-surface/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-accent">
                          0{idx + 1}
                        </span>
                        <div>
                          <span className="font-display text-base text-ink font-medium block">
                            {sec.name}
                          </span>
                          <span className="text-[0.65rem] text-muted uppercase tracking-wider">
                            Template: {sec.template}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 text-[0.6rem] uppercase tracking-wider font-semibold border ${
                            sec.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-500/10 border-red-500/30 text-red-600'
                          }`}
                        >
                          {sec.isActive ? 'Tampil' : 'Disembunyikan'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted" />
                        )}
                      </div>
                    </button>

                    {/* Section Edit Form Fields */}
                    {isExpanded && (
                      <div className="p-5 border-t border-line space-y-4 bg-bg/50 animate-in fade-in duration-200">
                        {/* Visibility Toggle */}
                        <div className="flex items-center justify-between p-3 border border-line bg-surface/30">
                          <span className="text-xs font-medium text-ink">
                            Status Visibilitas Seksi:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditData((prev: any) => ({ ...prev, isActive: !prev.isActive }))
                            }
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs uppercase font-semibold tracking-wider transition-colors border ${
                              editData.isActive
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                                : 'bg-red-500/15 border-red-500 text-red-600'
                            }`}
                          >
                            {editData.isActive ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Tampil di Web</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Disembunyikan</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* 1. HERO EDITORIAL */}
                        {sec.template === 'HERO_EDITORIAL' && (
                          <>
                            <Input
                              label="Eyebrow Atelier (Teks Kecil di Atas)"
                              value={editData.eyebrow}
                              onChange={(e) =>
                                setEditData({ ...editData, eyebrow: e.target.value })
                              }
                              placeholder="Maison de parfum, Jakarta"
                            />
                            <Input
                              label="Headline Utama (Title)"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              placeholder="Wear what cannot be seen."
                            />
                            <Textarea
                              label="Subjudul Narasi (Deskripsi)"
                              value={editData.subtitle}
                              onChange={(e) =>
                                setEditData({ ...editData, subtitle: e.target.value })
                              }
                              rows={3}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Teks Tombol CTA 1"
                                value={editData.contentData?.ctaText || ''}
                                onChange={(e) =>
                                  updateContentField('ctaText', e.target.value)
                                }
                                placeholder="Explore the collection"
                              />
                              <Input
                                label="Link Tombol CTA 1"
                                value={editData.contentData?.ctaLink || ''}
                                onChange={(e) =>
                                  updateContentField('ctaLink', e.target.value)
                                }
                                placeholder="/collection/"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Teks Tombol Link 2"
                                value={editData.contentData?.secondaryText || ''}
                                onChange={(e) =>
                                  updateContentField('secondaryText', e.target.value)
                                }
                                placeholder="Find your scent"
                              />
                              <Input
                                label="Link Tombol 2"
                                value={editData.contentData?.secondaryLink || ''}
                                onChange={(e) =>
                                  updateContentField('secondaryLink', e.target.value)
                                }
                                placeholder="/find/"
                              />
                            </div>
                          </>
                        )}

                        {/* 2. FRAGRANCE GRID SHOWCASE */}
                        {sec.template === 'FRAGRANCE_GRID' && (
                          <>
                            <Input
                              label="Judul Atas Showcase"
                              value={editData.eyebrow}
                              onChange={(e) =>
                                setEditData({ ...editData, eyebrow: e.target.value })
                              }
                              placeholder="Six compositions."
                            />
                            <Input
                              label="Judul Utama (Miring/Italic)"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              placeholder="Satu material, satu arah."
                            />
                            <Textarea
                              label="Catatan Kaki Koleksi (Bawah Grid)"
                              value={editData.contentData?.footerQuote || ''}
                              onChange={(e) =>
                                updateContentField('footerQuote', e.target.value)
                              }
                              rows={2}
                              placeholder="The collection stays at six. Komposisi baru menggantikan yang lama..."
                            />
                            <div className="p-3 bg-surface/30 border border-line text-xs text-muted">
                              Botol parfum pada katalog dibaca secara otomatis dari menu <strong>Katalog Parfum &amp; Stok</strong> di database. Anda dapat mengubah harga, nama, dan status stok parfum di sana.
                            </div>
                          </>
                        )}

                        {/* 3. MATERIAL STORY */}
                        {sec.template === 'MATERIAL_STORY' && (
                          <>
                            <Input
                              label="Headline Seksi Materials"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              placeholder="Materials, satu per satu."
                            />
                            <Textarea
                              label="Deskripsi Penjelas Bahan Mentah"
                              value={editData.subtitle}
                              onChange={(e) =>
                                setEditData({ ...editData, subtitle: e.target.value })
                              }
                              rows={2}
                              placeholder="Setiap komposisi dimulai dari satu material dan tempat asalnya..."
                            />
                          </>
                        )}

                        {/* 4. QUIZ CONSULTATION (RICH_TEXT_MEDIA) */}
                        {sec.template === 'RICH_TEXT_MEDIA' && (
                          <>
                            <Input
                              label="Headline Kuis / Konsultasi"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              placeholder="Tiga pertanyaan."
                            />
                            <Input
                              label="Subheadline (Miring/Italic)"
                              value={editData.subtitle}
                              onChange={(e) =>
                                setEditData({ ...editData, subtitle: e.target.value })
                              }
                              placeholder="Satu parfum."
                            />
                            <Textarea
                              label="Deskripsi Kuis"
                              value={editData.contentData?.description || ''}
                              onChange={(e) =>
                                updateContentField('description', e.target.value)
                              }
                              rows={2}
                              placeholder="Tiga pertanyaan singkat tentang suasana..."
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                label="Label 1: Room"
                                value={editData.contentData?.itemRoom || ''}
                                onChange={(e) =>
                                  updateContentField('itemRoom', e.target.value)
                                }
                                placeholder="Suasana yang Anda cari"
                              />
                              <Input
                                label="Label 2: Material"
                                value={editData.contentData?.itemMaterial || ''}
                                onChange={(e) =>
                                  updateContentField('itemMaterial', e.target.value)
                                }
                                placeholder="Bahan yang Anda sukai"
                              />
                              <Input
                                label="Label 3: Trace"
                                value={editData.contentData?.itemTrace || ''}
                                onChange={(e) =>
                                  updateContentField('itemTrace', e.target.value)
                                }
                                placeholder="Kekuatan parfumnya"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Teks Tombol Kuis"
                                value={editData.contentData?.ctaText || ''}
                                onChange={(e) =>
                                  updateContentField('ctaText', e.target.value)
                                }
                                placeholder="Find your scent"
                              />
                              <Input
                                label="Link Tombol"
                                value={editData.contentData?.ctaLink || ''}
                                onChange={(e) =>
                                  updateContentField('ctaLink', e.target.value)
                                }
                                placeholder="/find/"
                              />
                            </div>
                          </>
                        )}

                        {/* 5. ATELIER QUOTE (HERO_SPLIT) */}
                        {sec.template === 'HERO_SPLIT' && (
                          <>
                            <Textarea
                              label="Isi Kutipan Pendiri (Quote)"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              rows={3}
                              placeholder="The house is small on purpose..."
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Nama Tokoh"
                                value={editData.subtitle}
                                onChange={(e) =>
                                  setEditData({ ...editData, subtitle: e.target.value })
                                }
                                placeholder="Camille Aumont"
                              />
                              <Input
                                label="Jabatan / Peran"
                                value={editData.contentData?.authorRole || ''}
                                onChange={(e) =>
                                  updateContentField('authorRole', e.target.value)
                                }
                                placeholder="Founder and perfumer"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Teks Link"
                                value={editData.contentData?.ctaText || ''}
                                onChange={(e) =>
                                  updateContentField('ctaText', e.target.value)
                                }
                                placeholder="Inside the maison"
                              />
                              <Input
                                label="Tujuan Link"
                                value={editData.contentData?.ctaLink || ''}
                                onChange={(e) =>
                                  updateContentField('ctaLink', e.target.value)
                                }
                                placeholder="/maison/"
                              />
                            </div>
                          </>
                        )}

                        {/* 6. PROCESS STEPS */}
                        {sec.template === 'PROCESS_STEPS' && (
                          <>
                            <Input
                              label="Headline Proses Peracikan"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              placeholder="Slow is a material."
                            />
                            <Textarea
                              label="Subheadline Proses"
                              value={editData.subtitle}
                              onChange={(e) =>
                                setEditData({ ...editData, subtitle: e.target.value })
                              }
                              rows={2}
                              placeholder="Tidak ada yang selesai karena jadwal..."
                            />
                            <div className="space-y-3 pt-2 border-t border-line">
                              <div>
                                <Input
                                  label="Langkah 1: Judul"
                                  value={editData.contentData?.step1Title || ''}
                                  onChange={(e) =>
                                    updateContentField('step1Title', e.target.value)
                                  }
                                  placeholder="Compose"
                                />
                                <Textarea
                                  label="Langkah 1: Penjelasan"
                                  value={editData.contentData?.step1Copy || ''}
                                  onChange={(e) =>
                                    updateContentField('step1Copy', e.target.value)
                                  }
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Input
                                  label="Langkah 2: Judul"
                                  value={editData.contentData?.step2Title || ''}
                                  onChange={(e) =>
                                    updateContentField('step2Title', e.target.value)
                                  }
                                  placeholder="Macerate"
                                />
                                <Textarea
                                  label="Langkah 2: Penjelasan"
                                  value={editData.contentData?.step2Copy || ''}
                                  onChange={(e) =>
                                    updateContentField('step2Copy', e.target.value)
                                  }
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Input
                                  label="Langkah 3: Judul"
                                  value={editData.contentData?.step3Title || ''}
                                  onChange={(e) =>
                                    updateContentField('step3Title', e.target.value)
                                  }
                                  placeholder="Bottle"
                                />
                                <Textarea
                                  label="Langkah 3: Penjelasan"
                                  value={editData.contentData?.step3Copy || ''}
                                  onChange={(e) =>
                                    updateContentField('step3Copy', e.target.value)
                                  }
                                  rows={2}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* 7. HALAL & BPOM BADGE */}
                        {sec.template === 'HALAL_BPOM_BADGE' && (
                          <>
                            <Input
                              label="Eyebrow Kategori"
                              value={editData.eyebrow}
                              onChange={(e) =>
                                setEditData({ ...editData, eyebrow: e.target.value })
                              }
                              placeholder="Legality & Trust"
                            />
                            <Input
                              label="Headline Sertifikasi"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              placeholder="Sertifikasi Resmi BPOM & Halal"
                            />
                            <Textarea
                              label="Deskripsi Legalitas & Uji Laboratorium"
                              value={editData.subtitle}
                              onChange={(e) =>
                                setEditData({ ...editData, subtitle: e.target.value })
                              }
                              rows={2}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Teks Tombol Google Lens"
                                value={editData.contentData?.ctaText || ''}
                                onChange={(e) =>
                                  updateContentField('ctaText', e.target.value)
                                }
                                placeholder="Verifikasi Google Lens"
                              />
                              <Input
                                label="Kode Sertifikat Verifikasi"
                                value={editData.contentData?.featuredCode || ''}
                                onChange={(e) =>
                                  updateContentField('featuredCode', e.target.value)
                                }
                                placeholder="BPOM-OM01-VETIVER"
                              />
                            </div>
                          </>
                        )}

                        {/* 8. DISCOVERY SET BANNER */}
                        {sec.template === 'DISCOVERY_BANNER' && (
                          <>
                            <Input
                              label="Headline Discovery Set"
                              value={editData.title}
                              onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                              }
                              placeholder="Discovery Set (6 x 2 ml)"
                            />
                            <Textarea
                              label="Deskripsi Discovery Set"
                              value={editData.subtitle}
                              onChange={(e) =>
                                setEditData({ ...editData, subtitle: e.target.value })
                              }
                              rows={2}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Harga (Rupiah)"
                                type="number"
                                value={String(editData.contentData?.price || 450000)}
                                onChange={(e) =>
                                  updateContentField('price', Number(e.target.value))
                                }
                                placeholder="450000"
                              />
                              <Input
                                label="Teks Tombol Pesan"
                                value={editData.contentData?.ctaText || ''}
                                onChange={(e) =>
                                  updateContentField('ctaText', e.target.value)
                                }
                                placeholder="Pesan Discovery Set"
                              />
                            </div>
                          </>
                        )}

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-line flex items-center justify-between">
                          {saveSuccess ? (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tersimpan! Memperbarui halaman...</span>
                            </span>
                          ) : (
                            <span className="text-[0.65rem] text-muted">
                              Perubahan akan langsung disimpan ke database.
                            </span>
                          )}

                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Save className="w-3.5 h-3.5" />}
                            isLoading={isSaving}
                            onClick={() => handleSaveSection(sec.id)}
                          >
                            Simpan Perubahan
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
