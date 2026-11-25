import React, { useState, useEffect } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { StatusStepper } from '../ui/react/StatusStepper';
import { Button } from '../ui/react/Button';
import { Input } from '../ui/react/Input';
import { Badge } from '../ui/react/Badge';
import { CustomerAccountModal } from '../account/CustomerAccountModal';
import { toast } from 'sonner';
import { PrintableInvoice } from './PrintableInvoice';
import {
  Search,
  Package,
  MessageSquare,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  Printer,
  ArrowLeft,
  Eye,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  User,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

const MyOrdersInner: React.FC = () => {
  // Current view: 'list' | 'detail' | 'invoice'
  const [view, setView] = useState<'list' | 'detail' | 'invoice'>('list');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Search input for guests or looking up specific order
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Selected order being viewed in detail or invoice
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Check login session
  useEffect(() => {
    const checkSession = () => {
      const cached = localStorage.getItem('omoo_customer_user');
      if (cached) {
        try {
          setCurrentUser(JSON.parse(cached));
        } catch {}
      } else {
        setCurrentUser(null);
      }
    };

    checkSession();
    window.addEventListener('omoo:auth-changed', checkSession);

    // Also verify with server
    api.getMe().then((res) => {
      if (res?.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(res.user));
      }
    }).catch(() => {});

    // Check URL query ?order=OM-XXXX
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qOrder = params.get('order');
      if (qOrder) {
        setSearchOrderNumber(qOrder);
        handleLookupOrder(qOrder);
      }
    }

    return () => {
      window.removeEventListener('omoo:auth-changed', checkSession);
    };
  }, []);

  // Fetch logged-in user's orders automatically
  const { data: userOrdersData, isLoading: isLoadingUserOrders, refetch: refetchUserOrders } = useQuery({
    queryKey: ['my-orders', currentUser?.id, currentUser?.email],
    queryFn: () => (currentUser ? api.getMyOrders(currentUser.email || currentUser.id, currentUser.email) : null),
    enabled: !!currentUser,
  });

  const myOrders = userOrdersData?.data || [];

  // Helper to extract GPS coordinates from address string
  const getGpsFromAddress = (address: string) => {
    if (!address) return null;
    const match = address.match(/\[GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  // Search single order by order number (Guest or Member lookup)
  const handleLookupOrder = async (orderNum: string) => {
    if (!orderNum.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await api.trackOrder(orderNum.trim());
      if (res.success && res.data) {
        setActiveOrder(res.data);
        setView('detail');
      } else {
        setSearchError('Nomor pesanan tidak ditemukan. Periksa kembali nomor yang Anda masukkan.');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Nomor pesanan tidak ditemukan.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge variant="pending">Menunggu Pembayaran</Badge>;
      case 'AWAITING_VALIDATION':
        return <Badge variant="processing">Menunggu Validasi</Badge>;
      case 'PROCESSING':
        return <Badge variant="available">Diramu & Dikemas</Badge>;
      case 'SHIPPED':
        return <Badge variant="shipped">Dalam Pengiriman</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed">Pesanan Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="cancelled">Dibatalkan</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // ---------------------------------------------------------------------------
  // SUB-VIEW: INVOICE RESMI OMOO ATELIER (PRINTABLE 1-PAGE INVOICE)
  // ---------------------------------------------------------------------------
  if (view === 'invoice' && activeOrder) {
    return (
      <PrintableInvoice
        order={activeOrder}
        onBack={() => setView(currentUser ? 'list' : 'detail')}
        backLabel={`Kembali ke ${currentUser ? 'Daftar Pesanan Saya' : 'Pelacakan Pesanan'}`}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-VIEW: DETAIL TRACKER SATU PESANAN (TIMELINE & PETA GPS KURIR)
  // ---------------------------------------------------------------------------
  if (view === 'detail' && activeOrder) {
    const gps = getGpsFromAddress(activeOrder.shippingAddress);
    const googleMapsUrl = gps
      ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          activeOrder.shippingAddress || activeOrder.shippingCity || 'Indonesia'
        )}`;

    const cleanAddress = activeOrder.shippingAddress
      ? activeOrder.shippingAddress.replace(/\[GPS:\s*[^\]]+\]/, '').trim().replace(/,\s*$/, '')
      : '-';

    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke {currentUser ? 'Daftar Pesanan Saya' : 'Pencarian Pesanan'}</span>
          </button>

          {/* Tombol Lihat Invoice Resmi */}
          <button
            type="button"
            onClick={() => setView('invoice')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-ink text-bg text-xs font-semibold uppercase tracking-wider hover:bg-ink/80 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Lihat Faktur / Invoice Resmi ↗</span>
          </button>
        </div>

        {/* Order Summary Header */}
        <div className="border border-line bg-surface/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[0.62rem] uppercase font-bold tracking-[0.14em] text-accent block">
              Detail Status Pesanan
            </span>
            <h3 className="font-mono text-2xl font-bold text-ink mt-0.5">
              #{activeOrder.orderNumber}
            </h3>
            <p className="text-xs text-muted mt-1">
              Dipesan pada {new Date(activeOrder.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="sm:text-right">
            <div>{getStatusBadge(activeOrder.status)}</div>
            <p className="font-mono text-lg font-bold text-ink mt-1">
              Rp {activeOrder.totalAmount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Timeline Riwayat Perkembangan Pesanan */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <h4 className="text-[0.65rem] uppercase font-semibold tracking-[0.12em] text-muted border-b border-line pb-3">
            Status & Timeline Pesanan
          </h4>
          <StatusStepper
            currentStatus={activeOrder.status}
            trackingNumber={activeOrder.trackingNumber}
            courier={activeOrder.shippingCourier}
            createdAt={activeOrder.createdAt}
            validatedAt={activeOrder.validatedAt}
            updatedAt={activeOrder.updatedAt}
            paymentProofUrl={activeOrder.paymentProofUrl}
            paymentMethod={activeOrder.paymentMethod}
          />
        </div>

        {/* Peta GPS Rute Pengantaran Kurir (Shareloc) */}
        <div className="border border-line bg-surface/25 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <h4 className="font-display text-base text-ink font-normal">
                Titik Peta Lokasi Pengantaran Kurir (Shareloc)
              </h4>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4285F4]/10 border border-[#4285F4]/40 hover:bg-[#4285F4]/20 text-[#4285F4] text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Buka di Google Maps ↗</span>
            </a>
          </div>

          {gps && (
            <div className="space-y-2">
              <div className="h-56 w-full border border-line rounded overflow-hidden">
                <iframe
                  title="Peta Titik Antar Kurir"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${gps.lng - 0.006}%2C${gps.lat - 0.005}%2C${gps.lng + 0.006}%2C${gps.lat + 0.005}&layer=mapnik&marker=${gps.lat}%2C${gps.lng}`}
                  className="w-full h-full border-0"
                />
              </div>
              <p className="text-xs text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Titik GPS Terkunci: <strong className="font-mono text-ink">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</strong></span>
              </p>
            </div>
          )}

          <div className="border border-line bg-surface/30 p-4 text-xs space-y-1">
            <span className="text-[0.62rem] uppercase font-bold tracking-wider text-muted block">
              Alamat Pengiriman
            </span>
            <p className="text-ink leading-relaxed font-medium">{cleanAddress}</p>
            <p className="text-muted">
              {activeOrder.shippingCity}, {activeOrder.shippingPostal}
            </p>
            {activeOrder.shippingCourier && (
              <p className="text-[0.7rem] text-accent font-medium mt-1">
                Kurir: {activeOrder.shippingCourier} {activeOrder.trackingNumber ? `(Resi: ${activeOrder.trackingNumber})` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Item Flacon yang Dipesan */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <h4 className="font-display text-base text-ink font-normal border-b border-line pb-3">
            Item Flacon yang Dipesan
          </h4>

          <div className="divide-y divide-line">
            {(activeOrder.items || []).map((it: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-ink">{it.name}</p>
                  <p className="text-[0.68rem] text-muted">
                    {it.volume} &bull; {it.quantity} botol &bull; @ Rp {Number(it.unitPrice).toLocaleString('id-ID')}
                  </p>
                </div>
                <span className="font-mono font-bold text-ink">
                  Rp {Number(it.subtotal).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW UTAMA: HALAMAN "PESANAN SAYA" (LOGIN & NON-LOGIN)
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Context Header */}
      <div className="border border-line bg-surface/20 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.62rem] uppercase font-bold tracking-[0.16em] text-accent">
                Portal Pelanggan OMOO
              </span>
              {currentUser && (
                <span className="px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider bg-accent-fill/20 border border-accent/40 text-ink">
                  Terdaftar
                </span>
              )}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink font-normal mt-1">
              Pesanan Saya
            </h2>
            <p className="text-xs text-muted mt-1 max-w-xl leading-relaxed">
              {currentUser
                ? `Selamat datang, ${currentUser.name}. Berikut adalah riwayat pesanan dan faktur resmi Anda.`
                : 'Pantau status pengemasan, bukti bayar QRIS, rute pengiriman, serta unduh invoice resmi Anda.'}
            </p>
          </div>

          {!currentUser && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-bg text-xs uppercase tracking-wider font-semibold hover:bg-ink/80 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-accent" />
                <span>Masuk ke Akun Anda</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Pencarian Nomor Pesanan (Bisa digunakan oleh Tamu maupun Member) */}
        <div className="pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupOrder(searchOrderNumber);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <Input
              value={searchOrderNumber}
              onChange={(e) => setSearchOrderNumber(e.target.value)}
              placeholder="Cari nomor pesanan flacon spesifik (contoh: OM-20261122-0042)..."
              className="flex-1 font-mono uppercase text-xs"
              required
            />
            <Button
              type="submit"
              variant="primary"
              icon={<Search className="w-3.5 h-3.5" />}
              isLoading={isSearching}
            >
              Lacak Pesanan Ini
            </Button>
          </form>

          {searchError && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </div>
      </div>

      {/* KONDISI 1: CUSTOMER LOGIN (MENAMPILKAN SELURUH DATA PESANAN DIA) */}
      {currentUser && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent" />
              <h3 className="font-display text-xl text-ink font-normal">
                Riwayat Seluruh Pesanan Anda ({myOrders.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => refetchUserOrders()}
              className="text-[0.65rem] uppercase tracking-wider text-muted hover:text-ink underline cursor-pointer"
            >
              Perbarui Data
            </button>
          </div>

          {isLoadingUserOrders ? (
            <div className="p-12 text-center text-xs text-muted border border-line bg-surface/10">
              Memuat data pesanan Anda...
            </div>
          ) : myOrders.length === 0 ? (
            <div className="border border-line bg-surface/10 p-10 text-center space-y-3">
              <Package className="w-10 h-10 text-muted mx-auto opacity-50" />
              <h4 className="font-display text-lg text-ink font-normal">Belum Ada Pesanan</h4>
              <p className="text-xs text-muted max-w-md mx-auto">
                Anda belum memiliki riwayat pesanan di OMOO. Jelajahi enam varian parfum kami di halaman koleksi.
              </p>
              <div className="pt-2">
                <a
                  href="/collection"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-bg text-xs font-semibold uppercase tracking-wider hover:bg-ink/80 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Jelajahi Koleksi Parfum</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myOrders.map((ord: any) => {
                const itemsSummary = (ord.items || [])
                  .map((it: any) => `${it.quantity}x ${it.name}`)
                  .join(', ') || '1x Fragrance';

                return (
                  <div
                    key={ord.id}
                    className="border border-line bg-surface/20 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-ink/50 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-base font-bold text-ink">
                          #{ord.orderNumber}
                        </span>
                        {getStatusBadge(ord.status)}
                      </div>

                      <p className="text-xs text-ink font-medium">
                        {itemsSummary}
                      </p>

                      <p className="text-[0.68rem] text-muted">
                        Dipesan pada {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} &bull; Pengiriman ke {ord.shippingCity || 'Indonesia'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start md:items-end lg:items-center gap-3 shrink-0">
                      <div className="text-left sm:text-right md:text-left lg:text-right">
                        <span className="text-[0.6rem] uppercase tracking-wider text-muted block">
                          Total Tagihan:
                        </span>
                        <span className="font-mono text-base font-bold text-ink">
                          Rp {Number(ord.totalAmount).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Tombol Lihat Detail & Lacak */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveOrder(ord);
                            setView('detail');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-surface border border-line hover:border-ink text-ink transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent" />
                          <span>Detail & Lacak</span>
                        </button>

                        {/* Tombol Lihat Faktur / Invoice */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveOrder(ord);
                            setView('invoice');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-ink text-bg hover:bg-ink/80 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-accent" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Auth Modal jika tamu ingin masuk */}
      <CustomerAccountModal
        forceOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export const MyOrdersPage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MyOrdersInner />
    </QueryClientProvider>
  );
};
