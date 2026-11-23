import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../lib/api';
import { Button } from '../ui/react/Button';
import { Input } from '../ui/react/Input';
import { Modal } from '../ui/react/Modal';
import { toast, Toaster } from 'sonner';
import {
  Edit3,
  Save,
  CheckCircle2,
  X,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Lock,
  Layers,
} from 'lucide-react';

export const InlineVisualEditor: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick Admin Login modal if not authenticated
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@omoo.studio');
  const [adminPassword, setAdminPassword] = useState('admin123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Photo replacement modal
  const [activeImageKey, setActiveImageKey] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await api.uploadFile(file, 'editor');
      if (res.success && res.url) {
        handleApplyPhoto(res.url);
        toast.success('Foto berhasil diunggah dan diterapkan!');
      } else {
        toast.error(res.message || 'Gagal mengunggah foto');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah foto');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Preset atelier images for quick selection
  const presetPhotos = [
    { label: 'Botol Sel Brut', url: '/src/assets/images/bottle-sel.jpg' },
    { label: 'Botol Vetiver Obscur', url: '/src/assets/images/bottle-vetiver.jpg' },
    { label: 'Botol Iris Cendre', url: '/src/assets/images/bottle-iris.jpg' },
    { label: 'Botol Fig Nocturne', url: '/src/assets/images/bottle-fig.jpg' },
    { label: 'Botol Oud Intime', url: '/src/assets/images/bottle-oud.jpg' },
    { label: 'Atelier Maceration Room', url: '/src/assets/images/atelier.jpg' },
    { label: 'Pintu Masuk Atelier', url: '/src/assets/images/corridor.jpg' },
    { label: 'Makro Oud Gaharu', url: '/src/assets/images/macro-oud.jpg' },
    { label: 'Makro Vetiver Root', url: '/src/assets/images/macro-vetiver.jpg' },
    { label: 'Discovery Set Box', url: '/src/assets/images/bottle-ambrette.jpg' },
  ];

  // Check admin session and URL query parameter ?edit=true
  useEffect(() => {
    const checkAuth = () => {
      const adminSession = localStorage.getItem('omoo_admin_session');
      const cachedUser = localStorage.getItem('omoo_customer_user');
      let userRole = '';
      if (cachedUser) {
        try {
          userRole = JSON.parse(cachedUser).role;
        } catch {}
      }
      const admin = adminSession === 'active' || userRole === 'ADMIN';
      setIsAdmin(admin);

      // Check ?edit=true parameter or persistent edit mode
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const storedEdit = localStorage.getItem('omoo_visual_edit_mode') === 'true';
        if (params.get('edit') === 'true' || storedEdit) {
          if (admin) {
            enableEditMode();
          } else {
            setShowLoginModal(true);
          }
        }
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);

    const handleToggleEvent = () => {
      const active = localStorage.getItem('omoo_visual_edit_mode') === 'true';
      if (active) {
        enableEditMode();
      } else {
        disableEditMode();
      }
    };
    window.addEventListener('omoo:toggle-edit-mode', handleToggleEvent);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('omoo:toggle-edit-mode', handleToggleEvent);
    };
  }, []);

  const enableEditMode = () => {
    setIsEditMode(true);
    setSaveSuccess(false);
    localStorage.setItem('omoo_visual_edit_mode', 'true');

    // Pastikan navbar publik tetap tampil dan dapat digunakan untuk navigasi
    const nav = document.querySelector('header');
    if (nav) nav.style.removeProperty('display');

    // Apply contenteditable to all [data-editable-id] elements
    const editableEls = document.querySelectorAll<HTMLElement>('[data-editable-id]');
    editableEls.forEach((el) => {
      el.contentEditable = 'true';
      el.classList.add(
        'outline-dashed',
        'outline-1',
        'outline-accent/70',
        'hover:bg-accent/10',
        'transition-colors',
        'cursor-text'
      );
    });

    // Add photo edit triggers to [data-editable-img]
    const imgEls = document.querySelectorAll<HTMLElement>('[data-editable-img]');
    imgEls.forEach((wrapper) => {
      wrapper.classList.add('relative', 'group');
      if (!wrapper.querySelector('.edit-photo-btn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'edit-photo-btn absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-ink text-bg text-[0.65rem] uppercase font-semibold tracking-wider border border-line shadow-xl hover:bg-ink/80 transition-all cursor-pointer rounded-full';
        btn.innerHTML = '📷 Ganti Foto';
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const key = wrapper.getAttribute('data-editable-img');
          if (key) {
            setActiveImageKey(key);
            setIsPhotoModalOpen(true);
          }
        };
        wrapper.appendChild(btn);
      }
    });

    // Setup Dynamic Timeline Controls for About Us (/about)
    const timelineList = document.querySelector<HTMLElement>('#about-timeline-list');
    if (timelineList) {
      if (!timelineList.querySelector('.add-timeline-btn')) {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className =
          'add-timeline-btn mt-6 flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider border border-accent/40 hover:bg-accent/30 transition-all cursor-pointer rounded';
        addBtn.innerHTML = '<span>+</span> Tambah Tahun / Kronologi';
        addBtn.onclick = (e) => {
          e.preventDefault();
          const newId = `timeline-${Date.now()}`;
          const itemEl = document.createElement('div');
          itemEl.className =
            'timeline-item group relative flex items-start gap-6 border-b border-line pb-6 pt-2 animate-fade-in';
          itemEl.setAttribute('data-timeline-id', newId);
          itemEl.innerHTML = `
            <span class="font-display text-3xl font-light text-accent shrink-0 w-24 timeline-year outline-dashed outline-1 outline-accent/70 hover:bg-accent/10 cursor-text" contenteditable="true" data-editable-id="${newId}-year">2027</span>
            <p class="text-sm text-ink leading-relaxed flex-1 pt-1 timeline-copy outline-dashed outline-1 outline-accent/70 hover:bg-accent/10 cursor-text" contenteditable="true" data-editable-id="${newId}-copy">Deskripsi catatan atelier baru...</p>
            <button type="button" class="timeline-del-btn opacity-80 hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-500/30 hover:border-red-400 rounded transition-all ml-2 self-start">✕ Hapus</button>
          `;
          const delBtn = itemEl.querySelector<HTMLButtonElement>('.timeline-del-btn');
          if (delBtn) {
            delBtn.onclick = () => itemEl.remove();
          }
          timelineList.insertBefore(itemEl, addBtn);
        };
        timelineList.appendChild(addBtn);
      }

      timelineList.querySelectorAll<HTMLElement>('.timeline-item').forEach((item) => {
        if (!item.querySelector('.timeline-del-btn')) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className =
            'timeline-del-btn opacity-80 hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-500/30 hover:border-red-400 rounded transition-all ml-2 self-start';
          delBtn.innerText = '✕ Hapus';
          delBtn.onclick = () => {
            item.remove();
          };
          item.appendChild(delBtn);
        }
      });
    }

    // Setup Section Toolbar Badges on all [data-section-template]
    const sections = document.querySelectorAll<HTMLElement>('[data-section-template]');
    sections.forEach((sec, idx) => {
      if (!sec.querySelector('.section-control-badge')) {
        const tmpl = sec.getAttribute('data-section-template') || '';
        const name = sec.getAttribute('data-section-name') || tmpl || `Seksi ${idx + 1}`;
        const badge = document.createElement('div');
        badge.className =
          'section-control-badge absolute top-3 left-4 z-30 flex items-center gap-2 bg-ink text-bg text-[0.65rem] px-3 py-1.5 font-medium tracking-wider uppercase backdrop-blur shadow-xl rounded border border-line';
        badge.innerHTML = `
          <span class="text-accent font-semibold">${name}</span>
          <button type="button" class="del-section-btn text-red-400 hover:text-red-300 font-bold ml-2 transition-colors cursor-pointer" title="Hapus seksi ini permanen">✕ Hapus Seksi</button>
        `;
        const delBtn = badge.querySelector<HTMLButtonElement>('.del-section-btn');
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sec.setAttribute('data-section-deleted', 'true');
            sec.style.setProperty('display', 'none', 'important');
            toast.success(`Seksi "${name}" telah dihapus! Klik "Simpan Semua Perubahan" untuk menyimpan permanen ke database.`);
          };
        }
        sec.style.position = 'relative';
        sec.appendChild(badge);
      }
    });
  };

  const disableEditMode = () => {
    localStorage.removeItem('omoo_visual_edit_mode');
    setIsEditMode(false);
    window.dispatchEvent(new Event('omoo:toggle-edit-mode'));

    // Tampilkan kembali navbar publik
    const nav = document.querySelector('header');
    if (nav) nav.style.removeProperty('display');

    // Remove contenteditable
    const editableEls = document.querySelectorAll<HTMLElement>('[data-editable-id]');
    editableEls.forEach((el) => {
      el.contentEditable = 'false';
      el.classList.remove(
        'outline-dashed',
        'outline-1',
        'outline-accent/70',
        'hover:bg-accent/10',
        'transition-colors',
        'cursor-text'
      );
    });

    // Remove photo buttons and timeline controls
    document.querySelectorAll('.edit-photo-btn').forEach((btn) => btn.remove());
    document.querySelectorAll('.add-timeline-btn').forEach((btn) => btn.remove());
    document.querySelectorAll('.timeline-del-btn').forEach((btn) => btn.remove());
    document.querySelectorAll('.section-control-badge').forEach((btn) => btn.remove());
  };

  const handleApplyPhoto = (url: string) => {
    if (!activeImageKey) return;
    const targetWrapper = document.querySelector(`[data-editable-img="${activeImageKey}"]`);
    if (targetWrapper) {
      const img = targetWrapper.querySelector('img');
      if (img) {
        img.src = url;
        img.srcset = '';
      }
    }
    setIsPhotoModalOpen(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Helper to safely read innerText
      const getVal = (id: string, fallback = '') => {
        const el = document.querySelector<HTMLElement>(`[data-editable-id="${id}"]`);
        return el ? el.innerText.trim() : fallback;
      };

      // Helper to read image src
      const getImgSrc = (key: string, fallback = '') => {
        const wrapper = document.querySelector<HTMLElement>(`[data-editable-img="${key}"]`);
        const img = wrapper?.querySelector('img');
        return img ? img.src : fallback;
      };

      // Collect all deleted / hidden sections on page
      const hiddenSections: string[] = [];
      document.querySelectorAll<HTMLElement>('[data-section-template]').forEach((sec) => {
        const tmpl = sec.getAttribute('data-section-template');
        const isDeleted = sec.hasAttribute('data-section-deleted') || sec.style.display === 'none';
        if (tmpl && isDeleted) {
          hiddenSections.push(tmpl);
        }
      });

      // Build structured payload for the 8 sections matching database templates
      const payload = {
        HERO_EDITORIAL: {
          isActive: !hiddenSections.includes('HERO_EDITORIAL'),
          eyebrow: getVal('hero-eyebrow'),
          title: getVal('hero-title'),
          subtitle: getVal('hero-subtitle'),
          contentData: {
            ctaText: getVal('hero-cta'),
            secondaryText: getVal('hero-secondary'),
            bottleImage: getImgSrc('hero-bottle'),
          },
        },
        FRAGRANCE_GRID: {
          isActive: !hiddenSections.includes('FRAGRANCE_GRID'),
          eyebrow: getVal('showcase-eyebrow'),
          title: getVal('showcase-title'),
          subtitle: getVal('showcase-subtitle'),
          contentData: {
            footerQuote: getVal('showcase-quote'),
          },
        },
        MATERIAL_STORY: {
          isActive: !hiddenSections.includes('MATERIAL_STORY'),
          title: getVal('material-title'),
          subtitle: getVal('material-subtitle'),
        },
        RICH_TEXT_MEDIA: {
          isActive: !hiddenSections.includes('RICH_TEXT_MEDIA'),
          title: getVal('quiz-title'),
          subtitle: getVal('quiz-subtitle'),
          contentData: {
            description: getVal('quiz-desc'),
            itemRoom: getVal('quiz-item-room'),
            itemMaterial: getVal('quiz-item-material'),
            itemTrace: getVal('quiz-item-trace'),
            ctaText: getVal('quiz-cta'),
          },
        },
        HERO_SPLIT: {
          isActive: !hiddenSections.includes('HERO_SPLIT'),
          title: getVal('quote-text'),
          subtitle: getVal('quote-author'),
          contentData: {
            authorRole: getVal('quote-role'),
            ctaText: getVal('quote-cta'),
          },
        },
        PROCESS_STEPS: {
          isActive: !hiddenSections.includes('PROCESS_STEPS'),
          title: getVal('process-title'),
          subtitle: getVal('process-subtitle'),
          contentData: {
            step1Title: getVal('step1-title'),
            step1Copy: getVal('step1-copy'),
            step2Title: getVal('step2-title'),
            step2Copy: getVal('step2-copy'),
            step3Title: getVal('step3-title'),
            step3Copy: getVal('step3-copy'),
          },
        },
        HALAL_BPOM_BADGE: {
          isActive: !hiddenSections.includes('HALAL_BPOM_BADGE'),
          eyebrow: getVal('halal-eyebrow'),
          title: getVal('halal-title'),
          subtitle: getVal('halal-subtitle'),
          contentData: {
            ctaText: getVal('halal-cta'),
            scanNotice: getVal('halal-notice'),
          },
        },
        DISCOVERY_BANNER: {
          isActive: !hiddenSections.includes('DISCOVERY_BANNER'),
          title: getVal('discovery-title'),
          subtitle: getVal('discovery-subtitle'),
          contentData: {
            ctaText: getVal('discovery-cta'),
            price: Number(getVal('discovery-price').replace(/[^0-9]/g, '')) || 450000,
          },
        },
      };

      // Determine current page slug
      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      let currentSlug = 'home';
      if (path.includes('/about') || path.includes('/maison')) currentSlug = 'about';
      else if (path.includes('/journey') || path.includes('/journal')) currentSlug = 'journey';
      else if (path.includes('/collection')) currentSlug = 'collection';
      else if (path.includes('/find')) currentSlug = 'find';

      // Harvest all data-editable-id fields on current page
      const elementsMap: Record<string, string> = {};
      document.querySelectorAll<HTMLElement>('[data-editable-id]').forEach((el) => {
        const id = el.getAttribute('data-editable-id');
        if (id) elementsMap[id] = el.innerText.trim();
      });

      // Harvest all data-editable-img sources on current page
      const imagesMap: Record<string, string> = {};
      document.querySelectorAll<HTMLElement>('[data-editable-img]').forEach((el) => {
        const key = el.getAttribute('data-editable-img');
        const img = el.querySelector('img');
        if (key && img) imagesMap[key] = img.src;
      });

      // Harvest dynamic timeline items (About Us)
      const timelineItems: Array<{ id: string; year: string; copy: string }> = [];
      document.querySelectorAll('#about-timeline-list .timeline-item').forEach((el, index) => {
        const id = el.getAttribute('data-timeline-id') || `timeline-${Date.now()}-${index}`;
        const yearEl = el.querySelector('.timeline-year') as HTMLElement;
        const copyEl = el.querySelector('.timeline-copy') as HTMLElement;
        const year = yearEl ? yearEl.innerText.trim() : '';
        const copy = copyEl ? copyEl.innerText.trim() : '';
        if (year || copy) {
          timelineItems.push({ id, year, copy });
        }
      });

      // Sync any updated footer fields to global site settings
      const footerUpdates: any = {};
      if (elementsMap['footer-headline']) footerUpdates.footerHeadline = elementsMap['footer-headline'];
      if (elementsMap['footer-street']) footerUpdates.street = elementsMap['footer-street'];
      if (elementsMap['footer-city']) footerUpdates.city = elementsMap['footer-city'];
      if (elementsMap['footer-country']) footerUpdates.country = elementsMap['footer-country'];
      if (elementsMap['footer-visit-note']) footerUpdates.visitNote = elementsMap['footer-visit-note'];
      if (elementsMap['footer-hours']) footerUpdates.hours = elementsMap['footer-hours'];
      if (elementsMap['footer-email']) footerUpdates.email = elementsMap['footer-email'];
      if (elementsMap['footer-email-note']) footerUpdates.footerEmailNote = elementsMap['footer-email-note'];
      if (elementsMap['footer-social-heading']) footerUpdates.footerSocialHeading = elementsMap['footer-social-heading'];
      if (elementsMap['footer-copyright']) footerUpdates.copyright = elementsMap['footer-copyright'];

      if (Object.keys(footerUpdates).length > 0) {
        try {
          await api.updateSettings(footerUpdates);
        } catch {}
      }

      await api.syncPageVisual({
        slug: currentSlug,
        elements: elementsMap,
        images: imagesMap,
        sections: payload,
        hiddenSections,
        ...(timelineItems.length > 0 ? { timeline: timelineItems } : {}),
      });

      setSaveSuccess(true);
      toast.success(`Semua perubahan visual halaman '${currentSlug}' berhasil disimpan ke database!`);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan perubahan ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
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
      enableEditMode();
    } catch (err: any) {
      setLoginError(err.message || 'Kredensial admin tidak valid.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      {/* FLOATING LIVE EDITOR DOCK (Bottom-Center, Non-intrusive, Navbar stays 100% accessible) */}
      {isEditMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-wrap items-center gap-3 bg-[#0a0d08]/95 border border-accent/60 px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl rounded-full text-xs animate-in slide-in-from-bottom duration-300 max-w-[95vw]">
          {/* Badge Mode */}
          <div className="flex items-center gap-2 pr-3 border-r border-line shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="font-semibold text-accent tracking-wider uppercase text-[0.66rem]">
              Live Visual Editor
            </span>
          </div>

          {/* Direct Quick Jump Links across all editable pages */}
          <div className="hidden sm:flex items-center gap-1 pr-3 border-r border-line text-[0.66rem] font-medium uppercase tracking-wider text-muted shrink-0">
            <span className="text-[0.6rem] text-muted/60 mr-1">Halaman:</span>
            {[
              { href: '/', label: 'Home' },
              { href: '/collection', label: 'Collection' },
              { href: '/about', label: 'About Us' },
              { href: '/journey', label: 'Journey' },
              { href: '/find', label: 'Find Scent' },
            ].map((page) => (
              <a
                key={page.href}
                href={page.href}
                className="px-2 py-1 rounded hover:bg-surface/60 hover:text-ink transition-colors"
                title={`Pindah ke halaman ${page.label}`}
              >
                {page.label}
              </a>
            ))}
          </div>

          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-in fade-in shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tersimpan!</span>
            </span>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<Save className="w-3.5 h-3.5" />}
              isLoading={isSaving}
              onClick={handleSaveAll}
              className="bg-accent text-bg hover:bg-accent/90 rounded-full px-4 text-xs font-semibold uppercase tracking-wider"
            >
              Simpan Perubahan
            </Button>

            <button
              type="button"
              onClick={disableEditMode}
              className="px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted hover:text-ink border border-line hover:border-ink rounded-full transition-colors cursor-pointer"
            >
              Keluar Edit
            </button>

            <a
              href="/admin"
              className="p-1.5 text-muted hover:text-ink border border-line hover:border-ink rounded-full transition-colors"
              title="Buka Dashboard Admin"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* MODAL: Ganti Foto Langsung */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Ganti Foto Wewangian / Atelier"
        subtitle="Pilih foto dari galeri atelier atau masukkan URL foto gambar Anda sendiri."
        maxWidth="lg"
      >
        <div className="space-y-5">
          <div>
            <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block mb-2">
              1. Pilih dari Galeri Foto Atelier Tersedia
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {presetPhotos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPhoto(p.url)}
                  className="p-2.5 text-left border border-line bg-surface/20 hover:border-ink hover:bg-surface/40 transition-colors text-xs flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate text-ink">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload File Langsung */}
          <div className="pt-3 border-t border-line space-y-2">
            <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
              2. Atau Upload Foto Langsung dari Komputer
            </label>
            <div className="border border-dashed border-line p-4 text-center hover:border-accent transition-colors bg-surface/20 rounded">
              <input
                type="file"
                id="modal-direct-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="modal-direct-upload"
                className="cursor-pointer text-xs flex flex-col items-center gap-1.5 text-muted hover:text-ink"
              >
                <ImageIcon className="w-5 h-5 text-accent" />
                <span>{isUploadingPhoto ? 'Mengunggah foto...' : 'Klik untuk memilih file gambar dari perangkat Anda'}</span>
                <span className="text-[0.6rem] text-muted/70">Mendukung format JPG, PNG, WEBP</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-line space-y-3">
            <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
              3. Atau Masukkan URL Gambar Kustom
            </label>
            <Input
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="https://example.com/foto-parfum.jpg"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPhotoModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (customImageUrl.trim()) {
                    handleApplyPhoto(customImageUrl.trim());
                  }
                }}
              >
                Terapkan Foto Ini
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Quick Admin Login if not authenticated */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#070906]/70 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative w-full max-w-sm bg-bg border border-line p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div>
                <h4 className="font-display text-lg text-ink font-normal">
                  Autentikasi Admin
                </h4>
                <p className="text-[0.62rem] text-muted uppercase tracking-wider">
                  Masuk untuk mengedit langsung di Landing Page
                </p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowLoginModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoggingIn}>
                  Masuk & Mulai Edit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
