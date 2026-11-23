import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/react/Button';
import { Input, Textarea } from '../ui/react/Input';
import { SearchableSelect } from '../ui/react/SearchableSelect';
import { InteractivePinMap } from './InteractivePinMap';
import { toast } from 'sonner';
import {
  QrCode,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Package,
  Upload,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Clock,
  Search,
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

interface ProductInfo {
  id?: string;
  name: string;
  edition: string;
  volume: string;
  price: number;
  bottleImage: string;
}

interface MapSuggestion {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  postcode?: string;
  state?: string;
  city?: string;
  fullAddress: string;
}

export const CheckoutPage: React.FC = () => {
  // Step: 'form' | 'qris'
  const [step, setStep] = useState<'form' | 'qris'>('form');

  // Product Selection (default Vetiver Obscura or from URL ?product=...)
  const [product, setProduct] = useState<ProductInfo>({
    name: 'Vetiver Obscura',
    edition: 'OM-01',
    volume: '50 ml / Extrait',
    price: 2450000,
    bottleImage: '/src/assets/images/bottle-vetiver.jpg',
  });
  const [quantity, setQuantity] = useState(1);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Customer Form
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Shipping Address & GPS Shareloc
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Map Search (seperti pencarian Google Maps)
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState<MapSuggestion[]>([]);
  const [showMapResults, setShowMapResults] = useState(false);

  // Dynamic Open Source Indonesian Wilayah API States
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

  // Order Submission & QRIS Result
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  // Payment Proof Upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);

  // 1. Initial Load: Product, Logged-in Customer, and Provinces
  useEffect(() => {
    // Load logged-in customer if any
    const cachedUser = localStorage.getItem('omoo_customer_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setLoggedInUser(u);
        if (u.name) setName(u.name);
        if (u.email) setEmail(u.email);
        if (u.phone) setPhone(u.phone);
      } catch {}
    }

    // Load Product from URL
    const params = new URLSearchParams(window.location.search);
    const productQuery = params.get('product') || params.get('slug') || params.get('id');

    if (productQuery) {
      setIsLoadingProduct(true);
      api.getPerfumes().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const found = res.data.find(
            (p: any) =>
              p.slug === productQuery ||
              p.id === productQuery ||
              p.name.toLowerCase().includes(productQuery.toLowerCase())
          );
          if (found) {
            setProduct({
              id: found.id,
              name: found.name,
              edition: found.edition || 'OM-01',
              volume: found.volume || '50 ml / Extrait',
              price: Number(found.price) || 2450000,
              bottleImage: found.bottleImage || '/src/assets/images/bottle-vetiver.jpg',
            });
          }
        }
      }).finally(() => setIsLoadingProduct(false));
    }

    // Load Provinces from Open Source API
    setIsLoadingProvinces(true);
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch(() => {
        toast.error('Gagal memuat data provinsi wilayah.');
      })
      .finally(() => setIsLoadingProvinces(false));
  }, []);

  // 2. Cascade: Province -> Regencies
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

  // 3. Cascade: Regency -> Districts
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

  // 4. Cascade: District -> Villages
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

  // 4a. Handle Interactive Map Pin Click / Drag
  const handleMapPinChange = async (lat: number, lng: number) => {
    setGpsCoordinates({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const detectedStreet =
          [addr.road, addr.house_number, addr.suburb || addr.neighbourhood]
            .filter(Boolean)
            .join(', ') || data.display_name;
        if (detectedStreet) setAddress(detectedStreet);
        if (addr.postcode) setPostalCode(addr.postcode);

        if (addr.state) {
          const stateName = addr.state.toUpperCase();
          const matchedProv = provinces.find((p) =>
            stateName.includes(p.name) || p.name.includes(stateName)
          );
          if (matchedProv) {
            handleProvinceSelect(matchedProv.id);
          }
        }
      }
    } catch {}
  };

  // 4b. Map Location Autocomplete & Search (Google Maps typeahead style using Photon + Nominatim)
  const fetchMapSuggestions = async (query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setMapSearchResults([]);
      setShowMapResults(false);
      return;
    }

    setIsSearchingMap(true);
    try {
      // 1. Photon (Komoot) autocomplete engine (fast, typo-tolerant, finds warungs, shops, streets, landmarks)
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=7`
      );
      const photonData = await photonRes.json();

      let items: MapSuggestion[] = [];
      if (photonData?.features && photonData.features.length > 0) {
        items = photonData.features.map((f: any, idx: number) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [106.8, -6.2];
          const title = p.name || p.street || p.city || q;
          const subParts = [p.street, p.locality, p.district, p.city || p.county, p.state, p.country]
            .filter(Boolean)
            .filter((val, i, arr) => arr.indexOf(val) === i && val !== title);
          return {
            id: `photon-${idx}-${p.osm_id || idx}`,
            title,
            subtitle: subParts.join(', ') || p.country || 'Indonesia',
            lat: coords[1],
            lng: coords[0],
            postcode: p.postcode,
            state: p.state,
            city: p.city || p.county,
            fullAddress: [title, ...subParts].filter(Boolean).join(', '),
          };
        });
      }

      // 2. If Photon returned 0 items, fallback to Nominatim
      if (items.length === 0) {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&countrycodes=id&addressdetails=1&limit=5`
        );
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          items = nomData.map((it: any, idx: number) => {
            const parts = (it.display_name || '').split(',');
            const title = parts[0]?.trim() || q;
            const subtitle = parts.slice(1, 4).join(',').trim();
            return {
              id: `nom-${idx}-${it.place_id || idx}`,
              title,
              subtitle,
              lat: parseFloat(it.lat),
              lng: parseFloat(it.lon),
              postcode: it.address?.postcode,
              state: it.address?.state,
              city: it.address?.city || it.address?.town,
              fullAddress: it.display_name,
            };
          });
        }
      }

      setMapSearchResults(items);
      setShowMapResults(items.length > 0);
    } catch (err: any) {
      console.warn('Map autocomplete error:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Debounce autocomplete as user types in real-time
  useEffect(() => {
    if (!mapSearchQuery || mapSearchQuery.trim().length < 2) {
      setMapSearchResults([]);
      setShowMapResults(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchMapSuggestions(mapSearchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [mapSearchQuery]);

  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim()) {
      toast.error('Ketik nama jalan, komplek, daerah, atau kota');
      return;
    }
    fetchMapSuggestions(mapSearchQuery);
  };

  const handleSelectSearchResult = (item: MapSuggestion) => {
    setGpsCoordinates({ lat: item.lat, lng: item.lng });

    if (item.fullAddress) {
      setAddress(item.fullAddress);
    } else if (item.title) {
      setAddress(item.title);
    }

    if (item.postcode) {
      setPostalCode(item.postcode);
    }

    // Attempt auto-matching province if state is available
    if (item.state) {
      const stateName = item.state.toUpperCase();
      const matched = provinces.find((p) => stateName.includes(p.name) || p.name.includes(stateName));
      if (matched) {
        setSelectedProvince(matched);
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${matched.id}.json`)
          .then((r) => r.json())
          .then((regData) => {
            if (Array.isArray(regData)) {
              setRegencies(regData);
              const cityName = (item.city || '').toUpperCase();
              if (cityName) {
                const matchedReg = regData.find((r) => cityName.includes(r.name) || r.name.includes(cityName));
                if (matchedReg) setSelectedRegency(matchedReg);
              }
            }
          });
      }
    }

    setShowMapResults(false);
    toast.success(`Lokasi dipilih: ${item.title}`);
  };

  // 5. GPS Shareloc Feature
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Perangkat Anda tidak mendukung fitur lokasi GPS.');
      return;
    }

    setIsLocating(true);
    toast.info('Mendeteksi koordinat GPS dan alamat Anda...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsCoordinates({ lat, lng });

        try {
          // OpenStreetMap Nominatim Free Reverse Geocoding
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const detectedStreet =
              [addr.road, addr.house_number, addr.suburb || addr.neighbourhood]
                .filter(Boolean)
                .join(', ') || data.display_name;

            setAddress(detectedStreet);
            if (addr.postcode) setPostalCode(addr.postcode);

            // Attempt to auto-match province
            if (addr.state) {
              const matchedProv = provinces.find((p) =>
                addr.state.toUpperCase().includes(p.name) || p.name.includes(addr.state.toUpperCase())
              );
              if (matchedProv) {
                setSelectedProvince(matchedProv);
                // Load regencies for matched province
                fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${matchedProv.id}.json`)
                  .then((r) => r.json())
                  .then((regData) => {
                    if (Array.isArray(regData)) {
                      setRegencies(regData);
                      const detectedCity = addr.city || addr.town || addr.county || '';
                      if (detectedCity) {
                        const matchedReg = regData.find((r) =>
                          detectedCity.toUpperCase().includes(r.name) || r.name.includes(detectedCity.toUpperCase())
                        );
                        if (matchedReg) setSelectedRegency(matchedReg);
                      }
                    }
                  });
              }
            }

            toast.success('Lokasi GPS berhasil dibagikan & alamat terisi otomatis!');
          } else {
            toast.success(`Koordinat GPS tersimpan: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch {
          toast.success(`Koordinat GPS tersimpan: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Gagal mendapatkan lokasi GPS: ${err.message}`);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // 6. Submit Order & Go to QRIS Step
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error('Mohon lengkapi Nama, WhatsApp, dan Email Anda.');
      return;
    }

    if (!gpsCoordinates) {
      toast.error('Titik Lokasi GPS (Shareloc) Wajib Disertakan! Silakan klik tombol "Bagikan Lokasi (GPS)" atau tentukan titik lokasi Anda.');
      return;
    }

    if (!selectedProvince || !selectedRegency) {
      toast.error('Mohon pilih Provinsi dan Kabupaten / Kota tujuan pengiriman.');
      return;
    }

    if (!address.trim()) {
      toast.error('Mohon masukkan alamat lengkap pengiriman.');
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const fullAddressText = [
        address.trim(),
        selectedVillage ? `Desa/Kel. ${selectedVillage.name}` : '',
        selectedDistrict ? `Kec. ${selectedDistrict.name}` : '',
        selectedRegency.name,
        selectedProvince.name,
        postalCode.trim() ? `Kode Pos ${postalCode.trim()}` : '',
        gpsCoordinates ? `[GPS: ${gpsCoordinates.lat}, ${gpsCoordinates.lng}]` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const res = await api.createOrder({
        userId: loggedInUser?.id || null,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        shippingAddress: fullAddressText,
        shippingCity: selectedRegency.name || 'Jakarta',
        city: selectedRegency.name || 'Jakarta',
        shippingPostal: postalCode.trim() || '12190',
        postalCode: postalCode.trim() || '12190',
        notes: notes.trim(),
        items: [
          {
            name: product.name,
            productName: product.name,
            volume: product.volume,
            quantity,
            unitPrice: product.price,
            fragranceId: product.id,
          },
        ],
      });

      if (res.success && res.data) {
        setOrderResult(res.data);
        setStep('qris');
        toast.success(`Pesanan #${res.data.orderNumber} berhasil dibuat!`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(res.message || 'Gagal memproses pesanan.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // 7. Upload Receipt File directly
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!receiptFile || !orderResult?.id) {
      toast.error('Pilih file bukti transfer terlebih dahulu.');
      return;
    }

    setIsUploadingReceipt(true);

    try {
      // 1. Upload File to Server
      const uploadRes = await api.uploadFile(receiptFile, 'receipts');
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.message || 'Gagal mengunggah berkas gambar.');
      }

      // 2. Attach Receipt to Order
      const attachRes = await api.uploadReceipt(
        orderResult.id,
        uploadRes.url,
        `Bukti transfer via web checkout oleh ${name}`
      );

      if (attachRes.success) {
        setReceiptSubmitted(true);
        toast.success('Bukti transfer berhasil dikirim & disimpan!');
      } else {
        throw new Error(attachRes.message || 'Gagal menyimpan bukti transfer.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah bukti.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const totalAmount = product.price * quantity;
  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  const whatsappConfirmUrl = orderResult
    ? `https://wa.me/6282327362728?text=${encodeURIComponent(
        `Halo Admin OMOO, saya sudah melakukan pembayaran QRIS untuk pesanan #${orderResult.orderNumber} sebesar ${formattedTotal} atas nama ${name}. Mohon segera diverifikasi. Terima kasih.`
      )}`
    : '';

  return (
    <div className="min-h-screen bg-bg text-ink py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted border-b border-line pb-4">
          <a href="/" className="hover:text-ink transition-colors">
            OMOO
          </a>
          <span>/</span>
          <a href="/collection" className="hover:text-ink transition-colors">
            Collection
          </a>
          <span>/</span>
          <span className="text-ink font-semibold">
            {step === 'form' ? 'Checkout & Alamat Pengiriman' : 'Pembayaran QRIS'}
          </span>
        </div>

        {/* =================================================================== */}
        {/* STEP 1: FORMULIR PENGIRIMAN & DETAIL CHECKOUT */}
        {/* =================================================================== */}
        {step === 'form' && (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Customer Info, GPS Shareloc, Wilayah Dinamis (8 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Data Diri Pelanggan */}
              <div className="border border-line bg-surface/20 p-6 sm:p-7 space-y-4">
                <div className="border-b border-line pb-3">
                  <span className="text-[0.62rem] uppercase font-bold tracking-[0.16em] text-accent block">
                    Langkah 1 dari 2
                  </span>
                  <h2 className="font-display text-2xl text-ink font-normal mt-1">
                    Informasi Pembeli & Kontak
                  </h2>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Nama Lengkap Penerima *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Raffa Yuda Pratama"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nomor WhatsApp Aktif *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 082327362728"
                      helperText="Untuk konfirmasi resi kurir & status pesanan."
                      required
                    />

                    <Input
                      label="Alamat Email *"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="raffa@omoo.studio"
                      helperText="Salinan nomor pesanan akan dikirim ke sini."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Alamat Pengiriman, GPS Shareloc & Wilayah Indonesia Dinamis */}
              <div className="border border-line bg-surface/20 p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.62rem] uppercase font-bold tracking-[0.16em] text-accent block">
                        Alamat Pengiriman
                      </span>
                      <span className="px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wider bg-surface text-muted border border-line">
                        Pin Lokasi Peta
                      </span>
                    </div>
                    <h2 className="font-display text-2xl text-ink font-normal mt-1">
                      Alamat Pengiriman & Peta Lokasi
                    </h2>
                  </div>

                  {/* GPS Shareloc Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={isLocating}
                      className="inline-flex items-center gap-2 px-3.5 py-2 border border-accent bg-accent-fill/30 hover:bg-accent-fill/50 text-ink text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                      title="Gunakan GPS perangkat untuk mengisi lokasi & titik peta otomatis"
                    >
                      <MapPin className="w-4 h-4 text-accent shrink-0" />
                      <span>{isLocating ? 'Mendeteksi GPS...' : 'Gunakan GPS Perangkat'}</span>
                    </button>
                    {!gpsCoordinates && (
                      <button
                        type="button"
                        onClick={() => {
                          setGpsCoordinates({ lat: -6.2297, lng: 106.8073 });
                          toast.success('Menggunakan koordinat default Jakarta (-6.2297, 106.8073)');
                        }}
                        className="px-2.5 py-2 text-[0.62rem] uppercase tracking-wider border border-line text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer"
                        title="Klik untuk memasang koordinat pin bila GPS perangkat mati"
                      >
                        Pin Default
                      </button>
                    )}
                  </div>
                </div>

                {/* Fitur Pencarian Lokasi Seperti Google Maps (Live Autocomplete Suggestions) */}
                <div className="space-y-1.5 relative">
                  <label className="text-[0.62rem] uppercase font-bold tracking-wider text-muted block">
                    Cari Lokasi / Alamat di Peta (Google Maps Autocomplete)
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={mapSearchQuery}
                          onChange={(e) => {
                            setMapSearchQuery(e.target.value);
                            setShowMapResults(true);
                          }}
                          onFocus={() => {
                            if (mapSearchResults.length > 0) setShowMapResults(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (mapSearchResults.length > 0) {
                                handleSelectSearchResult(mapSearchResults[0]);
                              } else {
                                handleSearchLocation();
                              }
                            }
                          }}
                          placeholder="Ketik nama tempat, warung, toko, jalan, atau gedung..."
                          className="w-full bg-surface/40 border border-line px-3.5 py-2.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent pr-16"
                        />

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {isSearchingMap && (
                            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                          )}
                          {mapSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setMapSearchQuery('');
                                setMapSearchResults([]);
                                setShowMapResults(false);
                              }}
                              className="text-muted hover:text-ink cursor-pointer p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSearchLocation()}
                        disabled={isSearchingMap}
                        className="px-4 py-2 bg-ink text-bg text-xs font-semibold uppercase tracking-wider hover:bg-ink/80 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <Search className="w-3.5 h-3.5 text-accent" />
                        <span>Cari</span>
                      </button>
                    </div>

                    {/* Dropdown Live Suggestions Seperti Google Maps */}
                    {showMapResults && (
                      <div className="absolute top-full z-[9999] left-0 right-0 mt-1.5 bg-bg border border-line shadow-2xl rounded-xs max-h-64 overflow-y-auto divide-y divide-line/40">
                        {mapSearchResults.length > 0 ? (
                          mapSearchResults.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSearchResult(item);
                              }}
                              className="w-full text-left p-3 hover:bg-surface/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                            >
                              <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-ink leading-tight truncate group-hover:text-accent transition-colors">
                                  {item.title}
                                </p>
                                <p className="text-[0.68rem] text-muted truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : mapSearchQuery.trim().length >= 2 && !isSearchingMap ? (
                          <div className="p-3 text-center text-xs text-muted">
                            Tidak ditemukan saran tempat untuk "{mapSearchQuery}". Coba gunakan nama jalan atau daerah utama.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Peta Interaktif - Bisa Klik & Geser Pin Sendiri */}
                <div className="border border-line bg-surface/30 p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${gpsCoordinates ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className="text-xs font-medium text-ink">
                        {gpsCoordinates ? (
                          <>
                            Titik Pin Terkunci:{' '}
                            <strong className="font-mono">
                              {gpsCoordinates.lat.toFixed(5)}, {gpsCoordinates.lng.toFixed(5)}
                            </strong>
                          </>
                        ) : (
                          'Klik di peta untuk menentukan titik antar'
                        )}
                      </span>
                    </div>

                    {gpsCoordinates && (
                      <a
                        href={`https://www.google.com/maps?q=${gpsCoordinates.lat},${gpsCoordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4285F4]/10 border border-[#4285F4]/40 hover:bg-[#4285F4]/20 text-[#4285F4] text-[0.68rem] font-semibold uppercase tracking-wider transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka di Google Maps</span>
                      </a>
                    )}
                  </div>

                  {/* Leaflet Interactive Pin Map */}
                  <InteractivePinMap
                    coordinates={gpsCoordinates}
                    onChange={handleMapPinChange}
                    className="h-60 w-full"
                  />

                  <div className="text-[0.62rem] text-muted flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Anda dapat mengklik atau menggeser pin lokasi langsung pada peta.</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      className="text-accent underline hover:text-ink cursor-pointer"
                    >
                      Deteksi Ulang GPS
                    </button>
                  </div>
                </div>

                {/* WILAYAH INDONESIA BERTINGKAT (CUSTOM SEARCHABLE DROPDOWNS) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Provinsi */}
                    <SearchableSelect
                      label="Provinsi"
                      required
                      loading={isLoadingProvinces}
                      placeholder="-- Cari / Pilih Provinsi --"
                      searchPlaceholder="Ketik nama provinsi..."
                      value={selectedProvince?.id || ''}
                      options={provinces.map((p) => ({ value: p.id, label: p.name }))}
                      onChange={(val) => handleProvinceSelect(val)}
                    />

                    {/* 2. Kabupaten / Kota */}
                    <SearchableSelect
                      label="Kabupaten / Kota"
                      required
                      disabled={!selectedProvince || regencies.length === 0}
                      loading={isLoadingRegencies}
                      placeholder="-- Cari / Pilih Kota / Kab --"
                      searchPlaceholder="Ketik nama kota atau kabupaten..."
                      value={selectedRegency?.id || ''}
                      options={regencies.map((r) => ({ value: r.id, label: r.name }))}
                      onChange={(val) => handleRegencySelect(val)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 3. Kecamatan */}
                    <SearchableSelect
                      label="Kecamatan"
                      disabled={!selectedRegency || districts.length === 0}
                      loading={isLoadingDistricts}
                      placeholder="-- Cari / Pilih Kecamatan --"
                      searchPlaceholder="Ketik nama kecamatan..."
                      value={selectedDistrict?.id || ''}
                      options={districts.map((d) => ({ value: d.id, label: d.name }))}
                      onChange={(val) => handleDistrictSelect(val)}
                    />

                    {/* 4. Kelurahan / Desa */}
                    <SearchableSelect
                      label="Kelurahan / Desa"
                      disabled={!selectedDistrict || villages.length === 0}
                      loading={isLoadingVillages}
                      placeholder="-- Cari / Pilih Kelurahan / Desa --"
                      searchPlaceholder="Ketik nama kelurahan atau desa..."
                      value={selectedVillage?.id || ''}
                      options={villages.map((v) => ({ value: v.id, label: v.name }))}
                      onChange={(val) => {
                        setSelectedVillage(villages.find((v) => v.id === val) || null);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Textarea
                        label="Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan) *"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Contoh: Jl. Senopati No. 42, RT 02/RW 05, Pagar Hitam sebelah Apotek"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Kode Pos"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="12190"
                      />
                      <div className="mt-3">
                        <Input
                          label="Catatan Khusus Pengiriman"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Titip di pos security..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Product Summary & Pay Action (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-line bg-surface/30 p-6 sm:p-7 space-y-5 sticky top-24">
                <div className="border-b border-line pb-3">
                  <span className="text-[0.62rem] uppercase font-bold tracking-[0.16em] text-accent block">
                    Ringkasan Pesanan
                  </span>
                  <h3 className="font-display text-2xl text-ink font-normal mt-1">
                    Pesanan Anda
                  </h3>
                </div>

                {/* Product Item Card */}
                <div className="flex gap-4 items-start p-3 bg-bg border border-line">
                  <div className="w-20 h-24 border border-line bg-surface overflow-hidden shrink-0">
                    <img
                      src={product.bottleImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[0.6rem] uppercase tracking-wider text-muted font-semibold">
                      {product.edition}
                    </span>
                    <h4 className="font-display text-lg text-ink font-normal truncate">
                      {product.name}
                    </h4>
                    <p className="text-[0.68rem] text-muted">{product.volume}</p>
                    <p className="font-display text-base text-ink font-semibold">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(product.price)}
                    </p>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex flex-col items-center gap-1 border border-line bg-surface/40 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-6 h-6 flex items-center justify-center text-xs text-muted hover:text-ink font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold px-2">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-xs text-muted hover:text-ink font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2.5 pt-3 border-t border-line text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal ({quantity} botol)</span>
                    <span className="text-ink font-medium">{formattedTotal}</span>
                  </div>

                  <div className="flex justify-between text-muted">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-accent" />
                      <span>Pengiriman Kurir Ekspedisi</span>
                    </span>
                    <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[0.68rem]">
                      Gratis (Free Delivery)
                    </span>
                  </div>

                  <div className="flex justify-between text-muted">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                      <span>Asuransi & Kemasan Botol Kaca Aman</span>
                    </span>
                    <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[0.68rem]">
                      Termasuk
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-4 border-t border-line">
                    <span className="font-display text-lg text-ink font-normal">Total Pembayaran</span>
                    <span className="font-display text-2xl text-ink font-semibold">
                      {formattedTotal}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center text-xs tracking-[0.14em] uppercase py-4"
                  isLoading={isSubmittingOrder}
                  icon={<QrCode className="w-4 h-4 text-accent" />}
                >
                  Lanjut ke Pembayaran QRIS &rarr;
                </Button>

                <p className="text-[0.65rem] text-muted text-center leading-relaxed">
                  Setelah menekan tombol ini, QR Code QRIS akan dibuat secara otomatis dan dapat Anda bayar melalui BCA, Mandiri, BRI, GoPay, OVO, atau ShopeePay.
                </p>
              </div>
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* STEP 2: TAMPILAN QRIS & UNGGAH BUKTI TRANSFER */}
        {/* =================================================================== */}
        {step === 'qris' && orderResult && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header Success Order Created */}
            <div className="border border-line bg-surface/20 p-6 sm:p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border border-accent bg-accent-fill/20 flex items-center justify-center mx-auto text-accent">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[0.62rem] uppercase font-bold tracking-[0.16em] text-accent block">
                Pesanan Terdaftar
              </span>
              <h2 className="font-display text-3xl text-ink font-normal">
                #{orderResult.orderNumber}
              </h2>
              <p className="text-xs text-muted max-w-md mx-auto">
                Silakan lakukan pembayaran sejumlah <strong>{formattedTotal}</strong> menggunakan QRIS di bawah ini, lalu unggah bukti transfer untuk divalidasi.
              </p>
            </div>

            {/* QRIS Display Card */}
            <div className="border border-line bg-surface/30 p-6 sm:p-8 space-y-6 text-center">
              <div className="space-y-1">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Metode Pembayaran
                </p>
                <h3 className="font-display text-xl text-ink font-normal">
                  QRIS Standar Nasional (BCA, Mandiri, BRI, GoPay, OVO)
                </h3>
              </div>

              {/* QR Code Container */}
              <div className="inline-block p-5 bg-white border border-line shadow-xl mx-auto">
                <img
                  src={
                    orderResult.qrisPayload?.qrImageUrl ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                      `OMOO-ORDER-${orderResult.orderNumber}-${totalAmount}`
                    )}`
                  }
                  alt={`QRIS Pesanan ${orderResult.orderNumber}`}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                />
                <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between text-[0.65rem] text-gray-700 font-semibold uppercase tracking-wider">
                  <span>NMID: ID102026OMOO01</span>
                  <span>OMOO INDONESIA</span>
                </div>
              </div>

              <div className="p-4 bg-bg border border-line text-xs space-y-1 text-left max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-muted">Nomor Pesanan:</span>
                  <span className="font-semibold text-ink">#{orderResult.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Pembayaran:</span>
                  <span className="font-bold text-accent text-sm">{formattedTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Penerima:</span>
                  <span className="text-ink">{name} ({phone})</span>
                </div>
              </div>
            </div>

            {/* Upload Bukti Pembayaran Section */}
            <div className="border border-line bg-surface/20 p-6 sm:p-8 space-y-5">
              <div className="border-b border-line pb-3">
                <span className="text-[0.62rem] uppercase font-bold tracking-[0.16em] text-accent block">
                  Konfirmasi Pembayaran
                </span>
                <h3 className="font-display text-2xl text-ink font-normal mt-1">
                  Unggah Bukti Transfer
                </h3>
                <p className="text-xs text-muted mt-1">
                  Unggah tangkapan layar (screenshot) bukti transfer perbankan Anda agar dapat divalidasi oleh admin.
                </p>
              </div>

              {receiptSubmitted ? (
                <div className="p-5 border border-emerald-600/30 bg-emerald-950/20 text-emerald-400 space-y-3 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                  <p className="font-semibold text-sm">
                    Bukti Pembayaran Berhasil Diterima!
                  </p>
                  <p className="text-xs text-emerald-300">
                    Admin kami sedang memvalidasi pembayaran Anda. Anda juga dapat konfirmasi langsung ke WhatsApp admin kami di bawah ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Selector */}
                  <div className="border-2 border-dashed border-line p-6 text-center bg-bg/50 hover:bg-bg transition-colors">
                    {receiptPreview ? (
                      <div className="space-y-3">
                        <img
                          src={receiptPreview}
                          alt="Preview Bukti Bayar"
                          className="max-h-60 mx-auto object-contain border border-line"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFile(null);
                            setReceiptPreview('');
                          }}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          ✕ Ganti Berkas Lain
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2">
                        <Upload className="w-8 h-8 text-accent mx-auto" />
                        <span className="text-xs uppercase font-semibold tracking-wider text-ink block">
                          Pilih File Foto Bukti Transfer dari Perangkat
                        </span>
                        <span className="text-[0.65rem] text-muted block">
                          Format JPG, PNG, atau WEBP (Maksimal 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {receiptFile && (
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full justify-center text-xs tracking-wider uppercase py-3"
                      onClick={handleUploadPaymentProof}
                      isLoading={isUploadingReceipt}
                      icon={<Upload className="w-4 h-4 text-accent" />}
                    >
                      Kirim & Validasi Bukti Pembayaran Ini
                    </Button>
                  )}
                </div>
              )}

              {/* Action Buttons: WhatsApp Concierge & Tracker */}
              <div className="pt-4 border-t border-line flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappConfirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Konfirmasi via WhatsApp Admin</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={`/account/tracker?order=${encodeURIComponent(orderResult.orderNumber)}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-line bg-surface hover:border-ink text-ink font-semibold text-xs uppercase tracking-wider transition-colors text-center"
                >
                  <Package className="w-4 h-4 text-accent" />
                  <span>Buka Tracker Pesanan</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
