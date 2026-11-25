import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { openImageInNewTab } from '../../lib/imageCompression';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/react/Button';
import { Input, Textarea } from '../../components/ui/react/Input';
import { Badge } from '../../components/ui/react/Badge';
import { Modal } from '../../components/ui/react/Modal';
import { StatusStepper } from '../../components/ui/react/StatusStepper';
import { PrintableInvoice } from '../../components/tracker/PrintableInvoice';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  MessageSquare,
  FileImage,
  Truck,
  CheckCircle2,
  Printer,
  Edit,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface OrderDetailPageProps {
  orderId: string;
}

const OrderDetailContent: React.FC<OrderDetailPageProps> = ({ orderId }) => {
  const queryClient = useQueryClient();
  const [viewInvoice, setViewInvoice] = useState(false);

  // Shipping Form State
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('JNE YES');
  const [adminNotes, setAdminNotes] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'delete' }
    | { type: 'validate' }
    | { type: 'ship'; trk: string; cour: string; notes: string }
    | { type: 'complete' }
    | { type: 'revert'; targetStatus: string; targetLabel: string }
    | null
  >(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostal: '',
    shippingCourier: 'JNE YES',
    trackingNumber: '',
    status: 'PROCESSING',
    totalAmount: 0,
    adminNotes: '',
  });

  // Query Order Detail
  const { data: orderData, isLoading, isError } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: async () => {
      // Find from orders list
      const res = await api.getOrders();
      const found = (res.data || []).find((o: any) => o.id === orderId);
      if (!found) throw new Error('Pesanan tidak ditemukan');
      return { success: true, data: found };
    },
    enabled: !!orderId,
  });

  const order = orderData?.data;

  // Sync state when order is loaded
  React.useEffect(() => {
    if (order) {
      setTrackingNumber(order.trackingNumber || '');
      setCourier(order.shippingCourier || 'JNE YES');
      setAdminNotes(order.adminNotes || '');
    }
  }, [order]);

  // Mutations
  const validateMutation = useMutation({
    mutationFn: ({ notes }: { notes?: string }) =>
      api.validateOrderPayment(orderId, 'Admin Concierge', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pembayaran QRIS berhasil divalidasi lunas!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memvalidasi pembayaran.');
    },
  });

  const shipMutation = useMutation({
    mutationFn: ({ trk, cour, notes }: { trk: string; cour: string; notes?: string }) =>
      api.updateOrderStatus(orderId, {
        status: 'SHIPPED',
        trackingNumber: trk,
        shippingCourier: cour,
        adminNotes: notes || `Paket diserahkan ke ${cour} dengan nomor resi ${trk}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status pengiriman berhasil diperbarui!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui status pengiriman.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => api.updateOrderStatus(orderId, { status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pesanan ditandai telah selesai diterima customer.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyelesaikan pesanan.');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: any) => api.updateOrder(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Data pesanan berhasil diperbarui.');
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui pesanan.');
    },
  });

  const revertStatusMutation = useMutation({
    mutationFn: ({ targetStatus, targetLabel }: { targetStatus: string; targetLabel: string }) =>
      api.updateOrderStatus(orderId, {
        status: targetStatus,
        adminNotes: `Status dikembalikan ke "${targetLabel}" oleh Admin.`,
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`Status pesanan dikembalikan ke "${vars.targetLabel}".`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal mengembalikan status pesanan.');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () => api.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pesanan berhasil dihapus.');
      window.location.href = '/admin?tab=orders';
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus pesanan.');
    },
  });

  const handleOpenEditModal = () => {
    if (!order) return;
    setEditFormData({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      shippingAddress: order.shippingAddress || '',
      shippingCity: order.shippingCity || '',
      shippingPostal: order.shippingPostal || '',
      shippingCourier: order.shippingCourier || 'JNE YES',
      trackingNumber: order.trackingNumber || '',
      status: order.status || 'PROCESSING',
      totalAmount: order.totalAmount || 0,
      adminNotes: order.adminNotes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteOrder = () => {
    if (!order) return;
    setPendingAction({ type: 'delete' });
  };

  const handleConfirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'delete') {
      deleteOrderMutation.mutate();
    } else if (pendingAction.type === 'validate') {
      validateMutation.mutate({});
    } else if (pendingAction.type === 'ship') {
      shipMutation.mutate({
        trk: pendingAction.trk,
        cour: pendingAction.cour,
        notes: pendingAction.notes,
      });
    } else if (pendingAction.type === 'complete') {
      completeMutation.mutate();
    } else if (pendingAction.type === 'revert') {
      revertStatusMutation.mutate({
        targetStatus: pendingAction.targetStatus,
        targetLabel: pendingAction.targetLabel,
      });
    }
    setPendingAction(null);
  };

  const getGpsFromAddress = (address: string) => {
    if (!address) return null;
    const match = address.match(/\[GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge variant="pending">Menunggu Bayar</Badge>;
      case 'AWAITING_VALIDATION':
        return <Badge variant="processing">Menunggu Validasi</Badge>;
      case 'PROCESSING':
        return <Badge variant="available">Diramu & Dikemas</Badge>;
      case 'SHIPPED':
        return <Badge variant="shipped">Dalam Pengiriman</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="cancelled">Dibatalkan</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg p-8 flex items-center justify-center text-xs text-muted">
        Memuat detail pesanan...
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-bg p-8 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-medium text-ink">Pesanan tidak ditemukan</p>
        <a
          href="/admin?tab=orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-bg text-xs uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Validasi Pesanan</span>
        </a>
      </div>
    );
  }

  if (viewInvoice) {
    return (
      <div className="min-h-screen bg-bg p-4 sm:p-8">
        <PrintableInvoice
          order={order}
          onBack={() => setViewInvoice(false)}
          backLabel="Kembali ke Detail Pesanan"
        />
      </div>
    );
  }

  const gps = getGpsFromAddress(order.shippingAddress);
  const googleMapsUrl = gps
    ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        order.shippingAddress || order.shippingCity || 'Indonesia'
      )}`;

  const cleanAddress = order.shippingAddress
    ? order.shippingAddress.replace(/\[GPS:\s*[^\]]+\]/, '').trim().replace(/,\s*$/, '')
    : '-';

  return (
    <AdminLayout activeTab="orders" breadcrumb={`Detail #${order?.orderNumber || ''}`}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Navigation & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <a
            href="/admin?tab=orders"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pesanan</span>
          </a>

        {/* Action Buttons: Edit, Hapus, Cetak Faktur */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/admin/orders/${order.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/40 hover:bg-surface text-ink transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-accent" />
            <span>Edit Pesanan</span>
          </a>

          <button
            type="button"
            onClick={handleDeleteOrder}
            disabled={deleteOrderMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Pesanan</span>
          </button>

          <button
            type="button"
            onClick={() => setViewInvoice(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/40 hover:bg-surface text-ink transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-accent" />
            <span>Lihat & Cetak Faktur (1 Halaman)</span>
          </button>

          <span className="text-[0.65rem] font-mono uppercase text-muted ml-2">
            ID: {order.id}
          </span>
        </div>
      </div>

      {/* Order Status Banner */}
      <div className="border border-line bg-surface/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[0.62rem] uppercase font-bold tracking-[0.14em] text-accent">
              Faktur Pemesanan
            </span>
            <span className="text-muted text-xs">&bull;</span>
            <span className="text-xs text-muted">
              {new Date(order.createdAt).toLocaleString('id-ID', {
                dateStyle: 'full',
                timeStyle: 'medium',
              })}
            </span>
          </div>
          <h1 className="font-mono text-3xl font-bold text-ink mt-1">
            #{order.orderNumber}
          </h1>
        </div>

        <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2">
          <div>{getStatusBadge(order.status)}</div>
          <p className="font-mono text-xl font-bold text-ink">
            Rp {order.totalAmount.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* SECTION 1: PETA LOKASI PENGIRIMAN & SHARELOC (OPENSTREETMAP GRATIS TANPA API KEY) */}
      <div className="border border-line bg-surface/20 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg text-ink font-normal">
              Titik Peta Lokasi Pengiriman & Rute Kurir (Shareloc)
            </h2>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm rounded-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Google Maps (Arahkan Kurir) ↗</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 border border-line bg-black/10 overflow-hidden rounded relative">
            {gps ? (
              <div className="space-y-2">
                <div className="h-64 w-full">
                  <iframe
                    title="Peta Titik Lokasi Pengiriman"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${gps.lng - 0.008}%2C${gps.lat - 0.006}%2C${gps.lng + 0.008}%2C${gps.lat + 0.006}&layer=mapnik&marker=${gps.lat}%2C${gps.lng}`}
                    className="w-full h-full border-0"
                  />
                </div>
                <div className="p-3 bg-surface/40 flex items-center justify-between text-xs border-t border-line">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-ink font-medium">
                      Titik Koordinat Terkunci:{' '}
                      <strong className="font-mono text-accent">
                        {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center p-6 text-center text-muted text-xs space-y-2">
                <MapPin className="w-8 h-8 opacity-40 text-accent" />
                <p className="font-medium text-ink">Shareloc Peta Belum Disertakan</p>
                <p className="max-w-sm text-[0.7rem]">
                  Alamat dikonfirmasi lewat komunikasi manual.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-3">
            <div className="border border-line bg-surface/30 p-4 space-y-2 text-xs">
              <span className="text-[0.62rem] uppercase font-bold tracking-wider text-accent block">
                Detail Alamat Tujuan
              </span>
              <p className="font-medium text-ink leading-relaxed text-sm">{cleanAddress}</p>
              <div className="pt-2 border-t border-line text-muted space-y-1">
                <p>Kota/Kab: <strong className="text-ink">{order.shippingCity || 'Jakarta'}</strong></p>
                <p>Kode Pos: <strong className="font-mono text-ink">{order.shippingPostal || '-'}</strong></p>
                <p>Kurir Dipilih: <strong className="text-ink">{order.shippingCourier || 'JNE REG'}</strong></p>
              </div>
            </div>

            <div className="border border-line bg-surface/30 p-4 space-y-2 text-xs">
              <span className="text-[0.62rem] uppercase font-bold tracking-wider text-accent block">
                Penerima & Kontak
              </span>
              <p className="font-bold text-ink text-sm">{order.customerName}</p>
              <p className="text-muted">{order.customerEmail}</p>
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <span className="font-mono text-ink font-semibold">{order.customerPhone}</span>
                {order.customerPhone && (
                  <a
                    href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[0.68rem] uppercase font-semibold text-emerald-400 hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BUKTI BAYAR & PENGIRIMAN RESI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 border border-line bg-surface/20 p-6 space-y-4">
          <h2 className="font-display text-lg text-ink font-normal border-b border-line pb-3">
            Bukti Transfer & Pembayaran
          </h2>

          {order.paymentProofUrl ? (
            <div className="space-y-3">
              <div className="border border-line rounded overflow-hidden max-h-80 bg-black/20 flex items-center justify-center">
                <img
                  src={order.paymentProofUrl}
                  alt="Bukti Transfer Pembeli"
                  className="object-contain max-h-80 w-auto"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => openImageInNewTab(order.paymentProofUrl)}
                  className="inline-flex items-center gap-1.5 text-accent hover:underline font-semibold cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Ukuran Penuh di Tab Baru ↗</span>
                </button>
                {order.paymentProofNote && (
                  <span className="text-muted italic">"{order.paymentProofNote}"</span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 border border-line bg-surface/10 text-center space-y-2">
              <FileImage className="w-8 h-8 text-muted mx-auto opacity-40" />
              <p className="text-xs text-muted">Belum ada unggahan bukti bayar dari pembeli.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 border border-line bg-surface/20 p-6 space-y-4">
          <h2 className="font-display text-lg text-ink font-normal border-b border-line pb-3">
            Aksi Kelola Pesanan
          </h2>

          {order.status === 'AWAITING_VALIDATION' && (
            <div className="p-4 border border-amber-600/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 space-y-3">
              <p className="text-xs">
                Customer telah mengunggah bukti transfer. Silakan periksa kebenaran mutasi rekening atau QRIS toko sebelum memvalidasi.
              </p>
              <Button
                variant="primary"
                icon={<CheckCircle2 className="w-4 h-4 text-accent" />}
                isLoading={validateMutation.isPending}
                onClick={() => setPendingAction({ type: 'validate' })}
              >
                Validasi Pembayaran Lunas & Mulai Peracikan
              </Button>
            </div>
          )}

          {(order.status === 'PROCESSING' || order.status === 'SHIPPED') && (
            <div className="border border-line bg-surface/20 p-5 space-y-4">
              <h4 className="font-display text-base text-ink font-normal">
                {order.status === 'PROCESSING' ? 'Serahkan ke Kurir & Terbitkan Resi' : 'Informasi Resi Pelacakan Kurir'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Jasa Ekspedisi / Kurir"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="JNE YES / SiCepat / Paxel"
                  required
                />
                <Input
                  label="Nomor Resi Pengiriman (Airwaybill)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Contoh: JNE88291028471"
                  required
                />
              </div>

              <Textarea
                label="Catatan Khusus Pengiriman / Admin"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Paket telah dikemas rapi dengan segel wax..."
                rows={2}
              />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  icon={<Truck className="w-4 h-4" />}
                  isLoading={shipMutation.isPending}
                  onClick={() => {
                    if (!trackingNumber.trim()) {
                      toast.error('Mohon isi nomor resi pengiriman terlebih dahulu.');
                      return;
                    }
                    setPendingAction({
                      type: 'ship',
                      trk: trackingNumber.trim(),
                      cour: courier.trim(),
                      notes: adminNotes.trim(),
                    });
                  }}
                >
                  {order.status === 'PROCESSING' ? 'Terbitkan Resi & Tandai Dikirim' : 'Perbarui Data Resi'}
                </Button>

                {order.status === 'SHIPPED' && (
                  <Button
                    variant="secondary"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    isLoading={completeMutation.isPending}
                    onClick={() => setPendingAction({ type: 'complete' })}
                  >
                    Tandai Pesanan Selesai (Diterima Customer)
                  </Button>
                )}

                {order.status === 'PROCESSING' && (
                  <button
                    type="button"
                    disabled={revertStatusMutation.isPending}
                    onClick={() =>
                      setPendingAction({
                        type: 'revert',
                        targetStatus: 'AWAITING_VALIDATION',
                        targetLabel: 'Menunggu Validasi',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-line bg-surface/40 hover:border-amber-600/60 text-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan ke Menunggu Validasi</span>
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    type="button"
                    disabled={revertStatusMutation.isPending}
                    onClick={() =>
                      setPendingAction({
                        type: 'revert',
                        targetStatus: 'PROCESSING',
                        targetLabel: 'Diramu & Dikemas',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-line bg-surface/40 hover:border-amber-600/60 text-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan ke Diramu & Dikemas</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {order.status === 'COMPLETED' && (
            <div className="space-y-3">
              <div className="p-4 border border-emerald-600/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Seluruh rangkaian pemesanan telah selesai dan sampai ke tangan pelanggan dengan baik.</span>
              </div>
              <button
                type="button"
                disabled={revertStatusMutation.isPending}
                onClick={() =>
                  setPendingAction({
                    type: 'revert',
                    targetStatus: 'SHIPPED',
                    targetLabel: 'Dalam Pengiriman',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-line bg-surface/40 hover:border-amber-600/60 text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembalikan ke Dalam Pengiriman</span>
              </button>
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="space-y-3">
              <div className="p-4 border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
                Pesanan ini sedang berstatus Dibatalkan.
              </div>
              <button
                type="button"
                disabled={revertStatusMutation.isPending}
                onClick={() =>
                  setPendingAction({
                    type: 'revert',
                    targetStatus: 'AWAITING_VALIDATION',
                    targetLabel: 'Menunggu Validasi',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-line bg-surface/40 hover:border-amber-600/60 text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Aktifkan Kembali ke Menunggu Validasi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: TIMELINE RINGKAS STATUS */}
      <div className="border border-line bg-surface/20 p-6 space-y-4">
        <h2 className="font-display text-lg text-ink font-normal border-b border-line pb-3">
          Timeline Perkembangan Pesanan
        </h2>

        <StatusStepper
          currentStatus={order.status}
          trackingNumber={order.trackingNumber}
          courier={order.shippingCourier}
          createdAt={order.createdAt}
          validatedAt={order.validatedAt}
          updatedAt={order.updatedAt}
          paymentProofUrl={order.paymentProofUrl}
          paymentMethod={order.paymentMethod}
        />
      </div>

      {/* Pop-up Modal Konfirmasi Aksi / Hapus / Kembalikan Status */}
      <Modal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        title={
          pendingAction?.type === 'delete'
            ? 'Konfirmasi Hapus Data Pesanan'
            : pendingAction?.type === 'validate'
            ? 'Konfirmasi Validasi Pembayaran'
            : pendingAction?.type === 'ship'
            ? 'Konfirmasi Pengiriman & Resi'
            : pendingAction?.type === 'complete'
            ? 'Konfirmasi Pesanan Selesai'
            : 'Konfirmasi Kembalikan Proses Pesanan'
        }
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                pendingAction?.type === 'delete' ? 'text-red-500' : 'text-amber-500'
              }`}
            />
            <p className="text-xs leading-relaxed text-ink">
              {pendingAction?.type === 'delete' && (
                <>
                  Apakah Anda yakin ingin menghapus pesanan <strong>#{order.orderNumber}</strong> secara permanen? Data yang dihapus tidak dapat dipulihkan.
                </>
              )}
              {pendingAction?.type === 'validate' && (
                <>
                  Validasi pembayaran lunas untuk pesanan <strong>#{order.orderNumber}</strong> dan pindahkan proses ke tahap <strong>Diramu &amp; Dikemas</strong>?
                </>
              )}
              {pendingAction?.type === 'ship' && (
                <>
                  Terbitkan resi <strong>{pendingAction.trk}</strong> ({pendingAction.cour}) dan pindahkan pesanan <strong>#{order.orderNumber}</strong> ke status <strong>Dalam Pengiriman</strong>?
                </>
              )}
              {pendingAction?.type === 'complete' && (
                <>
                  Tandai pesanan <strong>#{order.orderNumber}</strong> telah diterima pelanggan dan berstatus <strong>Selesai</strong>?
                </>
              )}
              {pendingAction?.type === 'revert' && (
                <>
                  Kembalikan status pesanan <strong>#{order.orderNumber}</strong> ke tahap <strong>{pendingAction.targetLabel}</strong>?
                </>
              )}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setPendingAction(null)}>
              Batal
            </Button>
            <Button
              type="button"
              variant={pendingAction?.type === 'delete' ? 'danger' : 'primary'}
              onClick={handleConfirmPendingAction}
            >
              {pendingAction?.type === 'delete'
                ? 'Ya, Hapus Pesanan'
                : pendingAction?.type === 'revert'
                ? 'Ya, Kembalikan Status'
                : 'Ya, Lanjutkan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  </AdminLayout>
  );
};

export const OrderDetailPage: React.FC<OrderDetailPageProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" richColors />
      <OrderDetailContent {...props} />
    </QueryClientProvider>
  );
};
