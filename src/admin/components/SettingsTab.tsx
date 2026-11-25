import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { InteractivePinMap } from '../../components/checkout/InteractivePinMap';
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
  Loader2,
} from 'lucide-react';

function extractCoordsFromMapsText(text: string): { lat: number; lng: number } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // keep raw string if malformed URI sequence
  }

  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|query|ll|center)=(-?\d+\.\d+)(?:,|%2C|\s)+(-?\d+\.\d+)/i,
    /^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/,
  ];

  for (const regex of patterns) {
    const m = decoded.match(regex);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      }
    }
  }
  return null;
}

export const SettingsTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResolvingMap, setIsResolvingMap] = useState(false);
  const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    brandName: 'OMOO',
    tagline: 'Haute Parfumerie Jakarta — Grasse',
    phone: '+62 21 555 0192',
    whatsappNumber: '6281200000000',
    whatsappDisplay: '+62 812 0000 0000',
    email: 'hello@omoo.studio',
    officeTitle: 'Kantor & Studio OMOO',
    street: 'Jl. Senopati No. 42, Kebayoran Baru',
    city: 'Jakarta Selatan 12190',
    country: 'Indonesia',
    mapLat: -6.2297,
    mapLng: 106.8073,
    googleMapsUrl: '',
    hours: 'Senin - Sabtu: 10:00 - 20:00 WIB | Minggu: Janji Temu',
    visitNote: 'Kunjungan dengan janji temu',
    shippingFee: 25000,
    instagramHandle: '@omoo.parfums',
    instagramUrl: 'https://www.instagram.com/omoo.parfums/',
    tiktokHandle: '@omoo.parfums',
    tiktokUrl: 'https://www.tiktok.com/@omoo.parfums',
    pinterestHandle: 'omoo parfums',
    pinterestUrl: 'https://www.pinterest.com/omoo.parfums/',
    footerHeadline: 'Perfume made in small batches.\nDiracik perlahan di Jakarta, dari material pilihan.',
    footerEmailNote: 'Kami membalas dalam 1-2 hari kerja.',
    footerSocialHeading: 'Kabar terbaru dan catatan aroma OMOO.',
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

  const handleGoogleMapsUrlChange = (rawValue: string) => {
    setForm((prev) => ({ ...prev, googleMapsUrl: rawValue }));

    if (resolveTimeoutRef.current) {
      clearTimeout(resolveTimeoutRef.current);
      resolveTimeoutRef.current = null;
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
      setIsResolvingMap(false);
      return;
    }

    // 1. Try instant client-side extraction (handles full Google Maps URLs or raw "lat, lng")
    const directCoords = extractCoordsFromMapsText(trimmed);
    if (directCoords) {
      setIsResolvingMap(false);
      setForm((prev) => ({
        ...prev,
        googleMapsUrl: rawValue,
        mapLat: directCoords.lat,
        mapLng: directCoords.lng,
      }));
      toast.success(`Koordinat peta diperbarui (${directCoords.lat}, ${directCoords.lng})`);
      return;
    }

    // 2. If it's a shortened or full Google Maps URL without visible coords, resolve via backend
    if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co|(www\.|maps\.)?google\.(com|co\.id))\//i.test(trimmed)) {
      setIsResolvingMap(true);
      resolveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.resolveMapsLink(trimmed);
          if (res.success && res.data?.lat != null && res.data?.lng != null) {
            setForm((prev) => ({
              ...prev,
              mapLat: res.data.lat,
              mapLng: res.data.lng,
            }));
            toast.success(`Koordinat peta otomatis ditemukan (${res.data.lat}, ${res.data.lng})`);
          } else {
            toast.error(res.message || 'Koordinat tidak ditemukan dari link tersebut.');
          }
        } catch (err: any) {
          toast.error(err?.message || 'Gagal membaca koordinat dari link Google Maps.');
        } finally {
          setIsResolvingMap(false);
        }
      }, 350);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateSettings(form);
      if (res.success) {
        toast.success('Pengaturan toko, kontak, dan footer berhasil diperbarui!');
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
        Memuat konfigurasi toko OMOO...
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
            Toko, Kontak & Media Sosial
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
              Email Resmi Toko
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
              Telepon Resmi
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
            2. Lokasi Studio & Jam Operasional
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Nama Kantor / Judul Lokasi (Ditampilkan di Halaman Contact)
            </label>
            <Input
              value={form.officeTitle}
              onChange={(e) => handleChange('officeTitle', e.target.value)}
              placeholder="Kantor & Studio OMOO"
              required
            />
          </div>

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

          <div className="md:col-span-2">
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Jam Buka / Operasional
            </label>
            <Input
              value={form.hours}
              onChange={(e) => handleChange('hours', e.target.value)}
              placeholder="Senin - Sabtu: 10:00 - 20:00 WIB | Minggu: Janji Temu"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase font-semibold tracking-wider text-muted block mb-1.5">
              Ongkos Kirim Reguler (IDR)
            </label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.shippingFee}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, shippingFee: Math.max(0, Number(e.target.value) || 0) }))
              }
              placeholder="25000"
              helperText="Gratis otomatis bagi member yang memenuhi syarat Collector VIP."
            />
          </div>

          {/* Office Map Pin Selector */}
          <div className="md:col-span-3 space-y-3 pt-3 border-t border-line/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[0.65rem] uppercase font-semibold tracking-wider text-ink block">
                  Pin Lokasi Peta Kantor (Ditampilkan di Halaman Contact)
                </span>
                <span className="text-[0.68rem] text-muted">
                  Klik atau geser marker di peta untuk mengatur koordinat tepat lokasi kantor perusahaan.
                </span>
              </div>
              <span className="text-[0.68rem] font-mono text-muted">
                {Number(form.mapLat || -6.2297).toFixed(5)}, {Number(form.mapLng || 106.8073).toFixed(5)}
              </span>
            </div>

            <div className="border border-line overflow-hidden h-64">
              <InteractivePinMap
                coordinates={{
                  lat: Number(form.mapLat) || -6.2297,
                  lng: Number(form.mapLng) || 106.8073,
                }}
                onChange={(lat, lng) =>
                  setForm((prev) => ({ ...prev, mapLat: lat, mapLng: lng }))
                }
                className="h-64 w-full"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-[0.62rem] uppercase font-semibold tracking-wider text-muted block mb-1">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={form.mapLat}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, mapLat: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <label className="text-[0.62rem] uppercase font-semibold tracking-wider text-muted block mb-1">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={form.mapLng}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, mapLng: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[0.62rem] uppercase font-semibold tracking-wider text-muted block">
                    Link Google Maps (Opsional)
                  </label>
                  {isResolvingMap && (
                    <span className="inline-flex items-center gap-1 text-[0.62rem] text-accent">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mengambil titik...
                    </span>
                  )}
                </div>
                <Input
                  value={form.googleMapsUrl}
                  onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  helperText="Tempel link Google Maps (termasuk maps.app.goo.gl) untuk ubah pin peta otomatis."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Akun Media Sosial */}
      <div className="border border-line bg-surface/20 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <Share2 className="w-4 h-4 text-accent" />
          <h3 className="font-display text-lg font-light text-ink">
            3. Akun Media Sosial OMOO
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
                placeholder="Kabar terbaru dan catatan aroma OMOO."
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
          Simpan Semua Pengaturan
        </Button>
      </div>
    </form>
  );
};
