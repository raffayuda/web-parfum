import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { Textarea } from '../../components/ui/react/Textarea';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Truck,
  CreditCard,
  User,
  MapPin,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface OrderEditPageProps {
  orderId: string;
}

const OrderEditContent: React.FC<OrderEditPageProps> = ({ orderId }) => {
  const queryClient = useQueryClient();

  // Query order detail
  const { data: orderData, isLoading, isError } = useQuery({
    queryKey: ['admin-order-edit', orderId],
    queryFn: async () => {
      const res = await api.getOrders();
      const found = (res.data || []).find((o: any) => o.id === orderId);
      if (!found) throw new Error('Pesanan tidak ditemukan');
      return found;
    },
    enabled: !!orderId,
  });

  const order = orderData;

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostal, setShippingPostal] = useState('');
  const [shippingCourier, setShippingCourier] = useState('JNE YES');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [status, setStatus] = useState('PROCESSING');
  const [totalAmount, setTotalAmount] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');

  // Populate form once order data is ready
  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName || '');
      setCustomerPhone(order.customerPhone || '');
      setCustomerEmail(order.customerEmail || '');
      setShippingAddress(order.shippingAddress || '');
      setShippingCity(order.shippingCity || '');
      setShippingPostal(order.shippingPostal || '');
      setShippingCourier(order.shippingCourier || 'JNE YES');
      setTrackingNumber(order.trackingNumber || '');
      setStatus(order.status || 'PROCESSING');
      setTotalAmount(order.totalAmount || 0);
      setAdminNotes(order.adminNotes || '');
    }
  }, [order]);

  // Mutation to update order
  const updateOrderMutation = useMutation({
    mutationFn: (data: any) => api.updateOrder(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      toast.success('Data pesanan berhasil diperbarui!');
      window.location.href = `/admin/orders/${orderId}`;
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui pesanan.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingCity,
      shippingPostal,
      shippingCourier,
      trackingNumber,
      status,
      totalAmount: Number(totalAmount) || 0,
      adminNotes,
    };

    updateOrderMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted">
          Memuat Data Pesanan #{orderId}...
        </p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="font-display text-2xl text-ink">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-muted">ID Pesanan tidak valid atau pesanan telah dihapus.</p>
        <a
          href="/admin?tab=orders"
          className="px-4 py-2 border border-line hover:border-ink text-xs uppercase tracking-wider font-semibold text-ink transition-colors"
        >
          ← Kembali ke Daftar Pesanan
        </a>
      </div>
    );
  }

  return (
    <AdminLayout activeTab="orders" breadcrumb={`Edit Pesanan #${order?.orderNumber || ''}`}>
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <a
            href={`/admin/orders/${orderId}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Detail Pesanan</span>
          </a>

          <span className="text-[0.65rem] font-mono uppercase text-muted">
            Pesanan #{order.orderNumber}
          </span>
        </div>

      <div className="border border-line bg-surface/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[0.62rem] uppercase font-bold tracking-[0.14em] text-accent">
              Edit Data Pesanan
            </span>
            <span className="text-muted text-xs">&bull;</span>
            <span className="text-xs text-muted">
              Dibuat pada {new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </span>
          </div>
          <h1 className="font-mono text-3xl font-bold text-ink mt-1">
            #{order.orderNumber}
          </h1>
        </div>

        <div className="text-right">
          <span className="text-[0.6rem] uppercase tracking-wider text-muted block">
            Metode Bayar
          </span>
          <span className="font-semibold text-sm text-ink">{order.paymentMethod}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <User className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-ink font-normal">
              Informasi Pelanggan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Pemesan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Pemesan"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
        </div>

        {/* Shipping & Delivery */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <MapPin className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-ink font-normal">
              Alamat Pengiriman & Ekspedisi
            </h2>
          </div>

          <Textarea
            label="Alamat Pengiriman Lengkap"
            value={shippingAddress}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setShippingAddress(e.target.value)}
            rows={3}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Kota / Kabupaten"
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
            />
            <Input
              label="Kode Pos"
              value={shippingPostal}
              onChange={(e) => setShippingPostal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-line">
            <Input
              label="Kurir / Jasa Ekspedisi"
              value={shippingCourier}
              onChange={(e) => setShippingCourier(e.target.value)}
              placeholder="JNE YES / Paxel"
            />
            <Input
              label="Nomor Resi Pengiriman (Akan Muncul di Tracker Customer)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Contoh: JNE882910242"
            />
          </div>
        </div>

        {/* Order Status & Financials */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            <CreditCard className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-ink font-normal">
              Status & Keuangan Pesanan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Status Pesanan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none font-medium"
              >
                <option value="PENDING_PAYMENT">PENDING_PAYMENT (Menunggu Bayar)</option>
                <option value="AWAITING_VALIDATION">AWAITING_VALIDATION (Menunggu Validasi)</option>
                <option value="PROCESSING">PROCESSING (Diramu & Dikemas)</option>
                <option value="SHIPPED">SHIPPED (Dalam Pengiriman / Diserahkan Kurir)</option>
                <option value="COMPLETED">COMPLETED (Selesai Diterima Customer)</option>
                <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
              </select>
            </div>

            <Input
              label="Total Biaya Pembayaran (Rp)"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              required
            />
          </div>

          <Textarea
            label="Catatan Khusus Admin / Concierge"
            value={adminNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNotes(e.target.value)}
            placeholder="Tuliskan catatan internal untuk pesanan ini..."
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-line">
          <a
            href={`/admin/orders/${orderId}`}
            className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold uppercase tracking-wider border border-line hover:border-ink text-muted hover:text-ink transition-colors"
          >
            Batal & Kembali
          </a>

          <Button
            type="submit"
            variant="primary"
            isLoading={updateOrderMutation.isPending}
            className="px-8 py-3 text-xs uppercase tracking-widest font-bold"
          >
            Simpan Perubahan Pesanan
          </Button>
        </div>
      </form>
    </div>
  </AdminLayout>
  );
};

export const OrderEditPage: React.FC<OrderEditPageProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <OrderEditContent {...props} />
    </QueryClientProvider>
  );
};
