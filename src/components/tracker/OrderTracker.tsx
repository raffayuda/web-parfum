import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { StatusStepper } from '../ui/react/StatusStepper';
import { Button } from '../ui/react/Button';
import { Input } from '../ui/react/Input';
import { Search, Package, MessageSquare, AlertCircle, Clock, MapPin } from 'lucide-react';

const OrderTrackerInner: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to extract GPS coordinates from address string
  const getGpsFromAddress = (address: string) => {
    if (!address) return null;
    const match = address.match(/\[GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  // Automatically check URL query parameter ?order=OM-XXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryOrder = params.get('order');
      if (queryOrder) {
        setOrderNumber(queryOrder);
        handleSearchOrder(queryOrder);
      }
    }
  }, []);

  const handleSearchOrder = async (orderNum: string) => {
    if (!orderNum.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.trackOrder(orderNum.trim());
      if (res.success && res.data) {
        setSearchedOrder(res.data);
      } else {
        setError('Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.');
        setSearchedOrder(null);
      }
    } catch (err: any) {
      setError(err.message || 'Pesanan tidak ditemukan.');
      setSearchedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchOrder(orderNumber);
  };

  const adminWa = '6281200000000';
  const waContactUrl = searchedOrder
    ? `https://wa.me/${adminWa}?text=${encodeURIComponent(
        `Halo Concierge OMOO, saya ingin menanyakan perkembangan pesanan saya #${searchedOrder.orderNumber}.`
      )}`
    : `https://wa.me/${adminWa}?text=${encodeURIComponent(
        'Halo Concierge OMOO, saya butuh bantuan melacak pesanan saya.'
      )}`;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Search Bar */}
      <div className="border border-line bg-surface/30 p-6">
        <h3 className="font-display text-2xl text-ink font-normal mb-1">
          Lacak Pesanan Anda
        </h3>
        <p className="text-xs text-muted mb-4">
          Masukkan nomor pesanan yang Anda terima di email atau WhatsApp (contoh: <code>OM-20261122-0042</code>).
        </p>

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Nomor Pesanan (OM-XXXX)"
            className="flex-1 font-mono uppercase"
            required
          />
          <Button
            type="submit"
            variant="primary"
            icon={<Search className="w-3.5 h-3.5" />}
            isLoading={isLoading}
          >
            Lacak
          </Button>
        </form>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Display */}
      {searchedOrder && (
        <div className="border border-line bg-surface/20 p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="text-[0.62rem] uppercase font-semibold tracking-[0.14em] text-accent">
                Status Terkini
              </span>
              <h4 className="font-mono text-xl font-bold text-ink mt-0.5">
                #{searchedOrder.orderNumber}
              </h4>
              <p className="text-xs text-muted mt-1">
                Dibuat pada {new Date(searchedOrder.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted">
                Total Tagihan
              </span>
              <p className="font-mono text-lg font-bold text-ink">
                Rp {searchedOrder.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Interactive Stepper */}
          <div>
            <h5 className="text-[0.65rem] uppercase font-semibold tracking-[0.12em] text-muted mb-4">
              Status & Timeline Pesanan
            </h5>
            <StatusStepper
              currentStatus={searchedOrder.status}
              trackingNumber={searchedOrder.trackingNumber}
              courier={searchedOrder.shippingCourier}
              createdAt={searchedOrder.createdAt}
              validatedAt={searchedOrder.validatedAt}
              updatedAt={searchedOrder.updatedAt}
              paymentProofUrl={searchedOrder.paymentProofUrl}
              paymentMethod={searchedOrder.paymentMethod}
            />
          </div>

          {/* Peta Lokasi Pengiriman & Google Maps */}
          {(() => {
            const gps = getGpsFromAddress(searchedOrder.shippingAddress);
            const googleMapsUrl = gps
              ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchedOrder.shippingAddress || searchedOrder.shippingCity || 'Indonesia')}`;

            return (
              <div className="border border-line bg-surface/30 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                      Titik Lokasi Pengantaran Kurir (Shareloc)
                    </span>
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4285F4]/10 border border-[#4285F4]/40 hover:bg-[#4285F4]/20 text-[#4285F4] text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Lihat di Google Maps ↗</span>
                  </a>
                </div>

                {gps && (
                  <div className="h-52 w-full border border-line rounded overflow-hidden">
                    <iframe
                      title="Peta Titik Antar Kurir"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${gps.lng - 0.005}%2C${gps.lat - 0.004}%2C${gps.lng + 0.005}%2C${gps.lat + 0.004}&layer=mapnik&marker=${gps.lat}%2C${gps.lng}`}
                      className="w-full h-full border-0"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Items & Shipping Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-line pt-6 text-xs">
            <div className="border border-line p-4 bg-surface/30">
              <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted block mb-2">
                Item Wewangian
              </span>
              <div className="space-y-2">
                {(searchedOrder.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between border-b border-line/50 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-[0.68rem] text-muted">{item.volume} &bull; {item.quantity} botol</p>
                    </div>
                    <span className="font-mono font-medium text-ink">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-line p-4 bg-surface/30">
              <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted block mb-2">
                Tujuan Pengiriman
              </span>
              <p className="font-medium text-ink">{searchedOrder.customerName}</p>
              <p className="text-muted mt-0.5">{searchedOrder.customerPhone}</p>
              <p className="text-ink mt-1.5 leading-relaxed">{searchedOrder.shippingAddress}</p>
              <p className="text-muted mt-0.5">
                {searchedOrder.shippingCity}, {searchedOrder.shippingPostal}
              </p>
              {searchedOrder.shippingCourier && (
                <p className="text-[0.68rem] text-accent font-medium mt-2">
                  Kurir: {searchedOrder.shippingCourier}
                </p>
              )}
            </div>
          </div>

          {/* Assistance Footer */}
          <div className="border-t border-line pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted">
              Butuh bantuan terkait waktu peracikan atau pengiriman?
            </span>
            <a
              href={waContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800 dark:text-emerald-400 hover:underline"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hubungi Concierge WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrderTracker: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <OrderTrackerInner />
    </QueryClientProvider>
  );
};
