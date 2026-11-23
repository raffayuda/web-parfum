import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { toast } from 'sonner';
import {
  Save,
  Phone,
  Mail,
  MapPin,
  Clock,
  Share2,
  Globe,
  Sparkles,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    brandName: 'OMOO',
    tagline: 'Haute Parfumerie Jakarta — Grasse',
    phone: '+62 21 555 0192',
    whatsappNumber: '6281200000000',
    whatsappDisplay: '+62 812 0000 0000',
    email: 'hello@omoo.studio',
    street: 'Jl. Senopati No. 42, Kebayoran Baru',
    city: 'Jakarta Selatan 12190',
    country: 'Indonesia',
    hours: 'Senin - Sabtu: 10:00 - 20:00 WIB | Minggu: Janji Temu',
    visitNote: 'Kunjungan dengan janji temu',
    instagramHandle: '@omoo.parfums',
    instagramUrl: 'https://www.instagram.com/omoo.parfums/',
    tiktokHandle: '@omoo.parfums',
    tiktokUrl: 'https://www.tiktok.com/@omoo.parfums',
    pinterestHandle: 'omoo parfums',
    pinterestUrl: 'https://www.pinterest.com/omoo.parfums/',
    footerHeadline: 'Perfume made in small batches.\nDiracik perlahan di Jakarta, dari material pilihan.',
    footerEmailNote: 'Kami membalas dalam dua hari kerja.',
    footerSocialHeading: 'Catatan harian dari atelier.',
    copyright: '© 2026 Omoo Parfums. Jakarta, Indonesia. All rights reserved.',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.data) {
          setForm((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err: any) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateSettings(form);
      if (res.success) {
        toast.success('Pengaturan atelier, kontak, dan footer berhasil diperbarui!');
      } else {
        toast.error(res.message || 'Gagal menyimpan pengaturan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted text-sm animate-pulse">
        Memuat konfigurasi toko dan atelier OMOO...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-line pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[0.65rem] uppercase font-semibold tracking-[0.16em] text-accent block">
            PENGATURAN TOKO & IDENTITAS
          </span>
          <h2 className="font-display text-3xl font-light text-ink mt-1">
            Atelier, Kontak & Media Sosial
          </h2>
          <p className="text-xs text-muted mt-1">
            Data ini ditampilkan secara otomatis pada seluruh footer halaman, kontak pesanan, dan tautan sosial media web.
          </p>
        </div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSaving}
          icon={<Save className="w-4 h-4" />}
          className="bg-accent text-bg hover:bg-accent/90 shrink-0"
        >
          Simpan Pengaturan
        </Button>
      </div>

      {/* SECTION 1: Kontak & WhatsApp Concierge */}
      <div className="border border-line bg-surface/20 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <Phone className="w-4 h-4 text-accent" />
          <h3 className="font-display text-lg font-light text-ink">
            1. Kontak & WhatsApp Concierge
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Email Resmi Atelier
            </label>
            <Input
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="hello@omoo.studio"
              required
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Telepon Kantor Atelier
            </label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+62 21 555 0192"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Nomor WhatsApp Concierge (Format Angka Internasional)
            </label>
            <Input
              value={form.whatsappNumber}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              placeholder="6281200000000"
              required
            />
            <span className="text-[0.62rem] text-muted block mt-1">
              Digunakan untuk tautan klik langsung wa.me
            </span>
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Teks Tampilan WhatsApp
            </label>
            <Input
              value={form.whatsappDisplay}
              onChange={(e) => handleChange('whatsappDisplay', e.target.value)}
              placeholder="+62 812 0000 0000"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Alamat & Jam Buka */}
      <div className="border border-line bg-surface/20 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <MapPin className="w-4 h-4 text-accent" />
          <h3 className="font-display text-lg font-light text-ink">
            2. Lokasi Fisik Atelier & Jam Operasional
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Alamat Lengkap / Jalan
            </label>
            <Input
              value={form.street}
              onChange={(e) => handleChange('street', e.target.value)}
              placeholder="Jl. Senopati No. 42, Kebayoran Baru"
              required
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Kota & Kode Pos
            </label>
            <Input
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Jakarta Selatan 12190"
              required
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Negara
            </label>
            <Input
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Indonesia"
              required
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Catatan Kunjungan
            </label>
            <Input
              value={form.visitNote}
              onChange={(e) => handleChange('visitNote', e.target.value)}
              placeholder="Kunjungan dengan janji temu"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Jam Buka / Operasional
            </label>
            <Input
              value={form.hours}
              onChange={(e) => handleChange('hours', e.target.value)}
              placeholder="Senin - Sabtu: 10:00 - 20:00 WIB | Minggu: Janji Temu"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Akun Media Sosial */}
      <div className="border border-line bg-surface/20 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <Share2 className="w-4 h-4 text-accent" />
          <h3 className="font-display text-lg font-light text-ink">
            3. Akun Media Sosial Atelier
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Instagram Handle
            </label>
            <Input
              value={form.instagramHandle}
              onChange={(e) => handleChange('instagramHandle', e.target.value)}
              placeholder="@omoo.parfums"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              URL Profil Instagram
            </label>
            <Input
              value={form.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              placeholder="https://www.instagram.com/omoo.parfums/"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              TikTok Handle
            </label>
            <Input
              value={form.tiktokHandle}
              onChange={(e) => handleChange('tiktokHandle', e.target.value)}
              placeholder="@omoo.parfums"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              URL Profil TikTok
            </label>
            <Input
              value={form.tiktokUrl}
              onChange={(e) => handleChange('tiktokUrl', e.target.value)}
              placeholder="https://www.tiktok.com/@omoo.parfums"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Pinterest / Media Lain
            </label>
            <Input
              value={form.pinterestHandle}
              onChange={(e) => handleChange('pinterestHandle', e.target.value)}
              placeholder="omoo parfums"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              URL Pinterest / Media Lain
            </label>
            <Input
              value={form.pinterestUrl}
              onChange={(e) => handleChange('pinterestUrl', e.target.value)}
              placeholder="https://www.pinterest.com/omoo.parfums/"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Teks Footer & Hak Cipta */}
      <div className="border border-line bg-surface/20 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <Globe className="w-4 h-4 text-accent" />
          <h3 className="font-display text-lg font-light text-ink">
            4. Teks Editorial Footer & Kebijakan
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Slogan / Kalimat Pembuka Footer
            </label>
            <textarea
              value={form.footerHeadline}
              onChange={(e) => handleChange('footerHeadline', e.target.value)}
              rows={2}
              className="w-full bg-surface border border-line p-3 text-sm text-ink outline-none focus:border-accent"
              placeholder="Perfume made in small batches. Diracik perlahan di Jakarta..."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
                Catatan Waktu Balas Korespondensi Email
              </label>
              <Input
                value={form.footerEmailNote}
                onChange={(e) => handleChange('footerEmailNote', e.target.value)}
                placeholder="Kami membalas dalam dua hari kerja."
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
                Judul Ajakan Media Sosial
              </label>
              <Input
                value={form.footerSocialHeading}
                onChange={(e) => handleChange('footerSocialHeading', e.target.value)}
                placeholder="Catatan harian dari atelier."
              />
            </div>
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Teks Hak Cipta / Copyright
            </label>
            <Input
              value={form.copyright}
              onChange={(e) => handleChange('copyright', e.target.value)}
              placeholder="© 2026 Omoo Parfums. Jakarta, Indonesia. All rights reserved."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          icon={<Save className="w-4 h-4" />}
          className="bg-accent text-bg hover:bg-accent/90"
        >
          Simpan Semua Pengaturan Atelier
        </Button>
      </div>
    </form>
  );
};
