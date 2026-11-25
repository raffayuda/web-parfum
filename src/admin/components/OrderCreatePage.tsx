import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { Textarea } from '../../components/ui/react/Textarea';
import { SearchableSelect } from '../../components/ui/react/SearchableSelect';
import { InteractivePinMap } from '../../components/checkout/InteractivePinMap';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  Search,
  CheckCircle2,
  Navigation,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  province_id: string;
  name: string;
}

interface District {
  id: string;
  regency_id: string;
  name: string;
}

interface Village {
  id: string;
  district_id: string;
  name: string;
}

const OrderCreateContent: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-all'],
    queryFn: () => api.getUsers(),
  });

  const { data: perfumesData, isLoading: isLoadingPerfumes } = useQuery({
    queryKey: ['admin-perfumes-all'],
    queryFn: () => api.getPerfumes(),
  });

  const users = usersData?.data || [];
  const perfumes = perfumesData?.data || [];

  // Form State: Customer
  const [selectedAccountUserId, setSelectedAccountUserId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Form State: Product
  const [perfumeSlug, setPerfumeSlug] = useState('vetiver-obscura');
  const [quantity, setQuantity] = useState(1);

  // Form State: Shipping & Regions
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingCourier, setShippingCourier] = useState('JNE YES');

  // Form State: Map & Coordinates
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>({
    lat: -6.2297,
    lng: 106.8073,
  });
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Form State: Payment & Notes
  const [paymentStatus, setPaymentStatus] = useState('PROCESSING');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [adminNotes, setAdminNotes] = useState('');

  // Set default perfume when loaded
  useEffect(() => {
    if (perfumes.length > 0 && !perfumeSlug) {
      setPerfumeSlug(perfumes[0].slug);
    }
  }, [perfumes, perfumeSlug]);

  // Load provinces on mount
  useEffect(() => {
    setIsLoadingProvinces(true);
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch(() => {
        toast.error('Gagal memuat daftar provinsi.');
      })
      .finally(() => setIsLoadingProvinces(false));
  }, []);

  // Cascade handlers
  const handleProvinceSelect = (provId: string) => {
    const prov = provinces.find((p) => p.id === provId) || null;
    setSelectedProvince(prov);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    if (provId) {
      setIsLoadingRegencies(true);
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setRegencies(data);
        })
        .finally(() => setIsLoadingRegencies(false));
    }
  };

  const handleRegencySelect = (regId: string) => {
    const reg = regencies.find((r) => r.id === regId) || null;
    setSelectedRegency(reg);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setDistricts([]);
    setVillages([]);

    if (regId) {
      setIsLoadingDistricts(true);
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regId}.json`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setDistricts(data);
        })
        .finally(() => setIsLoadingDistricts(false));
    }
  };

  const handleDistrictSelect = (distId: string) => {
    const dist = districts.find((d) => d.id === distId) || null;
    setSelectedDistrict(dist);
    setSelectedVillage(null);
    setVillages([]);

    if (distId) {
      setIsLoadingVillages(true);
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${distId}.json`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setVillages(data);
        })
        .finally(() => setIsLoadingVillages(false));
    }
  };

  const handleVillageSelect = (villId: string) => {
    const vill = villages.find((v) => v.id === villId) || null;
    setSelectedVillage(vill);
  };

  // Real-time Debounced Autocomplete for Place Suggestions (Free OSM Nominatim)
  useEffect(() => {
    if (!searchLocationQuery || searchLocationQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const q = encodeURIComponent(searchLocationQuery.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=id&addressdetails=1&limit=6`,
          { headers: { 'Accept-Language': 'id,en' } }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.warn('Place suggest error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchLocationQuery]);

  // Click outside to close place suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Location Search (Immediate on Button or Enter)
  const handleSearchLocation = async () => {
    if (!searchLocationQuery.trim()) return;
    setIsSearchingLocation(true);

    try {
      const q = encodeURIComponent(searchLocationQuery.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=id&addressdetails=1&limit=6`,
        { headers: { 'Accept-Language': 'id,en' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        setShowSuggestions(true);
      } else {
        toast.info('Lokasi tidak ditemukan. Coba gunakan kata kunci kota atau nama jalan yang lebih umum.');
      }
    } catch {
      toast.error('Gagal mencari lokasi di peta.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setCoordinates({ lat, lng });
    setShowSuggestions(false);

    const parts = item.display_name.split(',');
    const title = parts[0]?.trim() || item.display_name;
    setSearchLocationQuery(title);

    // Auto-fill address if not filled yet
    if (!streetAddress.trim()) {
      setStreetAddress(item.display_name);
    }

    toast.success(`Pin peta diarahkan ke: ${title}`);
  };

  // Price Calculation
  const selectedPerfume = perfumes.find((p: any) => p.slug === perfumeSlug) || perfumes[0];
  const unitPrice = selectedPerfume?.price || 2450000;
  const totalPrice = unitPrice * (Number(quantity) || 1);

  // Mutation to Create Order
  const createOrderMutation = useMutation({
    mutationFn: (data: any) => api.createManualOrder(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pesanan manual berhasil dibuat!');
      if (res?.data?.id) {
        window.location.href = `/admin/orders/${res.data.id}`;
      } else {
        window.location.href = '/admin?tab=orders';
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membuat pesanan manual.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Mohon lengkapi nama, email, dan nomor WhatsApp customer.');
      return;
    }

    // Build formatted full address
    const regionParts = [
      selectedVillage ? `Desa/Kel. ${selectedVillage.name}` : '',
      selectedDistrict ? `Kec. ${selectedDistrict.name}` : '',
      selectedRegency ? selectedRegency.name : '',
      selectedProvince ? selectedProvince.name : '',
    ].filter(Boolean);

    const fullAddressText = [
      streetAddress.trim(),
      regionParts.join(', '),
      coordinates ? `[GPS: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}]` : '',
    ].filter(Boolean).join(', ');

    const cityText = selectedRegency ? selectedRegency.name : 'Jakarta Selatan';

    const payload = {
      userId: selectedAccountUserId || undefined,
      customerName,
      customerEmail,
      customerPhone,
      perfumeSlug,
      quantity: Number(quantity) || 1,
      shippingAddress: fullAddressText,
      shippingCity: cityText,
      shippingPostal: postalCode || '12190',
      shippingCourier,
      paymentMethod,
      paymentStatus,
      adminNotes: adminNotes
        ? `${adminNotes} • Titik GPS: ${coordinates?.lat}, ${coordinates?.lng}`
        : `Titik GPS Alamat: ${coordinates?.lat}, ${coordinates?.lng}`,
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <AdminLayout activeTab="orders" breadcrumb="Tambah Pesanan Manual">
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
        {/* Header & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <a
            href="/admin?tab=orders"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pesanan</span>
          </a>

          <span className="text-[0.65rem] font-mono uppercase text-muted">
            Form Pesanan Manual Concierge
          </span>
        </div>

      <div className="border border-line bg-surface/30 p-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[0.62rem] uppercase font-bold tracking-[0.14em] text-accent">
            Manajemen Pesanan
          </span>
          <span className="text-muted text-xs">&bull;</span>
          <span className="text-xs text-muted">Buat Pesanan Pelanggan Baru / Concierge</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-ink font-normal mt-1">
          Tambah Pesanan Manual
        </h1>
        <p className="text-xs text-muted mt-1 max-w-2xl">
          Gunakan formulir ini untuk membuat pesanan wewangian secara langsung atas permintaan pelanggan lewat WhatsApp, telepon, atau saluran concierge.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PILIH AKUN / DATA PEMESAN */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <User className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-ink font-normal">
              1. Akun & Kontak Pelanggan
            </h2>
          </div>

          <SearchableSelect
            label="Pilih Akun Customer Terdaftar (Searchable)"
            placeholder="-- Cari Akun (Ketik Nama, Email, atau No WA) --"
            searchPlaceholder="Cari customer terdaftar..."
            loading={isLoadingUsers}
            value={selectedAccountUserId}
            options={[
              {
                value: '',
                label: 'Tamu / Pelanggan Baru (Input Manual)',
                sublabel: 'Isi identitas baru secara manual di bawah',
              },
              ...users.map((u: any) => ({
                value: u.id,
                label: u.name,
                sublabel: `${u.email} • ${u.phone || 'Tanpa no HP'}`,
                badge: u.role === 'ADMIN' ? 'Admin' : (u.memberTier || 'Customer'),
              })),
            ]}
            onChange={(val) => {
              setSelectedAccountUserId(val);
              const found = users.find((u: any) => u.id === val);
              if (found) {
                setCustomerName(found.name || '');
                setCustomerEmail(found.email || '');
                setCustomerPhone(found.phone || '');
              }
            }}
            helperText="Pilih akun pengguna yang sudah ada di database untuk menghubungkan riwayat transaksinya, atau pilih 'Input Manual'."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Input
              label="Nama Lengkap Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Raden Mas Danang"
              required
            />
            <Input
              label="Nomor WhatsApp Aktif"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="081234567890"
              required
            />
            <Input
              label="Alamat Email Customer"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="danang@gmail.com"
              required
            />
          </div>
        </div>

        {/* SECTION 2: PILIH PRODUK & JUMLAH */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-ink font-normal">
              2. Pilihan Wewangian & Jumlah
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Pilih Varian Parfum
              </label>
              <select
                value={perfumeSlug}
                onChange={(e) => setPerfumeSlug(e.target.value)}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none font-medium"
              >
                {perfumes.map((p: any) => (
                  <option key={p.id} value={p.slug}>
                    {p.name} ({p.volume || '50 ml'}) — Rp {p.price?.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Jumlah (Botol)"
                type="number"
                min="1"
                value={quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>

            <div className="sm:col-span-3 border-l border-line sm:pl-4 space-y-1">
              <span className="text-[0.62rem] uppercase tracking-wider text-muted block">
                Total Biaya Pesanan
              </span>
              <span className="font-mono text-2xl font-bold text-ink">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
              <span className="text-[0.65rem] text-emerald-500 block font-medium">
                Gratis Ongkir & Kemasan Aman
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: WILAYAH INDONESIA, ALAMAT & PETA INTERAKTIF */}
        <div className="border border-line bg-surface/20 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-accent" />
              <h2 className="font-display text-lg text-ink font-normal">
                3. Alamat Tujuan & Peta Interaktif
              </h2>
            </div>
          </div>

          {/* Cascading Searchable Regional Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SearchableSelect
              label="Provinsi"
              placeholder="-- Cari Provinsi --"
              searchPlaceholder="Ketik nama provinsi..."
              loading={isLoadingProvinces}
              value={selectedProvince?.id || ''}
              options={provinces.map((p) => ({ value: p.id, label: p.name }))}
              onChange={handleProvinceSelect}
            />

            <SearchableSelect
              label="Kabupaten / Kota"
              placeholder="-- Cari Kab / Kota --"
              searchPlaceholder="Ketik nama kab/kota..."
              loading={isLoadingRegencies}
              disabled={!selectedProvince}
              value={selectedRegency?.id || ''}
              options={regencies.map((r) => ({ value: r.id, label: r.name }))}
              onChange={handleRegencySelect}
            />

            <SearchableSelect
              label="Kecamatan"
              placeholder="-- Cari Kecamatan --"
              searchPlaceholder="Ketik nama kecamatan..."
              loading={isLoadingDistricts}
              disabled={!selectedRegency}
              value={selectedDistrict?.id || ''}
              options={districts.map((d) => ({ value: d.id, label: d.name }))}
              onChange={handleDistrictSelect}
            />

            <SearchableSelect
              label="Kelurahan / Desa"
              placeholder="-- Cari Kel / Desa --"
              searchPlaceholder="Ketik nama desa/kelurahan..."
              loading={isLoadingVillages}
              disabled={!selectedDistrict}
              value={selectedVillage?.id || ''}
              options={villages.map((v) => ({ value: v.id, label: v.name }))}
              onChange={handleVillageSelect}
            />
          </div>

          {/* Street Address & Postal Code */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <Textarea
                label="Alamat Lengkap (Jalan, Nomor Rumah, RT/RW, Patokan)"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Contoh: Jl. Senopati No. 42, RT 02/RW 05, Pagar Hitam sebelah Apotek"
                rows={2}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Kode Pos"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12190"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Kurir Pengiriman"
                value={shippingCourier}
                onChange={(e) => setShippingCourier(e.target.value)}
                placeholder="JNE YES / Paxel"
                required
              />
            </div>
          </div>

          {/* Interactive Map & Search Pin */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Tentukan Titik Koordinat Pengiriman di Peta (Bisa Di-klik / Digeser)
              </label>

              {coordinates && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink font-mono">
                    GPS: <strong className="text-accent">{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</strong>
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[0.65rem] text-accent hover:underline uppercase font-bold"
                  >
                    <span>Buka di Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Nominatim Search Input with Real-time Floating Suggestions */}
            <div className="relative" ref={searchContainerRef}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchLocationQuery}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSuggestions(true);
                    }}
                    onChange={(e) => setSearchLocationQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchLocation();
                      }
                    }}
                    placeholder="Ketik nama tempat, gedung, toko, atau jalan (suggest otomatis muncul)..."
                    className="w-full bg-surface/50 border border-line pl-8 pr-8 py-2 text-xs text-ink placeholder:text-muted/60 focus:border-accent outline-none"
                  />
                  {isSearchingLocation && (
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                  {!isSearchingLocation && searchLocationQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchLocationQuery('');
                        setSearchResults([]);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-ink cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSearchLocation}
                  disabled={isSearchingLocation}
                  className="px-4 py-2 bg-surface border border-line hover:border-ink text-xs font-semibold uppercase tracking-wider text-ink transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isSearchingLocation ? 'Mencari...' : 'Cari di Peta'}
                </button>
              </div>

              {/* Floating Real-time Suggestions Dropdown */}
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] bg-bg border border-line shadow-2xl divide-y divide-line max-h-64 overflow-y-auto rounded-none">
                  <div className="p-2 bg-surface/50 border-b border-line text-[0.62rem] uppercase tracking-wider font-semibold text-muted flex items-center justify-between">
                    <span>Saran Lokasi ({searchResults.length})</span>
                    <span className="text-accent font-normal lowercase">klik untuk kunci pin peta</span>
                  </div>
                  {searchResults.map((item, idx) => {
                    const parts = item.display_name.split(',');
                    const title = parts[0]?.trim() || item.display_name;
                    const subtitle = parts.slice(1, 4).join(',').trim();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSearchResult(item)}
                        className="w-full text-left px-3.5 py-2.5 text-xs bg-bg hover:bg-surface/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                      >
                        <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink group-hover:text-accent transition-colors truncate">
                            {title}
                          </p>
                          <p className="text-[0.68rem] text-muted truncate">
                            {subtitle || item.display_name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map with OpenStreetMap Basemap */}
            <div className="border border-line overflow-hidden rounded">
              <InteractivePinMap
                coordinates={coordinates}
                onChange={(lat, lng) => setCoordinates({ lat, lng })}
                className="h-80 w-full"
              />
            </div>
            <p className="text-[0.68rem] text-muted">
              Klik langsung pada peta atau geser pin hijau untuk mengunci koordinat alamat pengantaran kurir.
            </p>
          </div>
        </div>

        {/* SECTION 4: PEMBAYARAN & CATATAN */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <CreditCard className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-ink font-normal">
              4. Status Pembayaran & Catatan Concierge
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              >
                <option value="QRIS">QRIS Dinamis (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay)</option>
                <option value="BANK_TRANSFER">Transfer Bank Manual (BCA Concierge)</option>
                <option value="CASH_ON_DELIVERY">COD / Pembayaran di Tempat</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Status Pembayaran Awal
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              >
                <option value="PROCESSING">LUNAS / DITERIMA (Langsung Diramu & Dikemas)</option>
                <option value="PENDING_PAYMENT">MENUNGGU BAYAR (Belum Konfirmasi Transfer)</option>
                <option value="AWAITING_VALIDATION">MENUNGGU VALIDASI (Bukti Transfer Telah Diterima)</option>
                <option value="SHIPPED">DIKIRIM (Sudah Diserahkan ke Ekspedisi)</option>
                <option value="COMPLETED">SELESAI (Pesanan Telah Tiba di Penerima)</option>
              </select>
            </div>
          </div>

          <Textarea
            label="Catatan Khusus Pesanan (Opsional)"
            value={adminNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNotes(e.target.value)}
            placeholder="Misal: Customer memesan melalui WhatsApp pribadi. Mintakan packaging gift box pita hitam."
            rows={2}
          />
        </div>

        {/* Action Buttons: Submit / Cancel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-line">
          <a
            href="/admin?tab=orders"
            className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold uppercase tracking-wider border border-line hover:border-ink text-muted hover:text-ink transition-colors"
          >
            Batal
          </a>

          <Button
            type="submit"
            variant="primary"
            isLoading={createOrderMutation.isPending}
            className="px-8 py-3 text-xs uppercase tracking-widest font-bold"
          >
            Terbitkan & Simpan Pesanan Manual
          </Button>
        </div>
      </form>
    </div>
  </AdminLayout>
  );
};

export const OrderCreatePage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" richColors />
      <OrderCreateContent />
    </QueryClientProvider>
  );
};
