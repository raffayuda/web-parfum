import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input, Textarea } from '../../components/ui/react/Input';
import { Badge } from '../../components/ui/react/Badge';
import { Table } from '../../components/ui/react/Table';
import { Modal } from '../../components/ui/react/Modal';
import { StatusStepper } from '../../components/ui/react/StatusStepper';
import { PrintableInvoice } from '../../components/tracker/PrintableInvoice';
import { SearchableSelect } from '../../components/ui/react/SearchableSelect';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Truck,
  Eye,
  FileImage,
  MessageSquare,
  ArrowLeft,
  MapPin,
  ExternalLink,
  Package,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  User,
  ShoppingBag,
} from 'lucide-react';

export const OrdersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [viewInvoice, setViewInvoice] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form states for Shipping directly on page
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('JNE YES');
  const [adminNotes, setAdminNotes] = useState('');

  // ---------------------------------------------------------------------------
  // Modal: Tambah Pesanan Manual
  // ---------------------------------------------------------------------------
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAccountUserId, setSelectedAccountUserId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerEmail, setManualCustomerEmail] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('Jakarta Selatan');
  const [manualPostal, setManualPostal] = useState('12190');
  const [manualCourier, setManualCourier] = useState('JNE YES');
  const [manualPerfumeSlug, setManualPerfumeSlug] = useState('vetiver-obscura');
  const [manualQuantity, setManualQuantity] = useState('1');
  const [manualPaymentStatus, setManualPaymentStatus] = useState('PROCESSING');
  const [manualAdminNotes, setManualAdminNotes] = useState('Pesanan diinput manual oleh Admin Concierge.');

  // ---------------------------------------------------------------------------
  // Modal: Edit Pesanan
  // ---------------------------------------------------------------------------
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostal: '',
    shippingCourier: '',
    trackingNumber: '',
    status: 'PROCESSING',
    totalAmount: 0,
    adminNotes: '',
  });

  // Queries
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => api.getOrders(statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-all'],
    queryFn: () => api.getUsers(),
  });

  const { data: perfumesData } = useQuery({
    queryKey: ['admin-perfumes-all'],
    queryFn: () => api.getPerfumes(),
  });

  const orders = ordersData?.data || [];
  const users = usersData?.data || [];
  const perfumes = perfumesData?.data || [];

  // Helper to extract GPS coordinates from address string
  const getGpsFromAddress = (address: string) => {
    if (!address) return null;
    const match = address.match(/\[GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  // Mutations
  const validateMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.validateOrderPayment(id, 'Admin Concierge', notes),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pembayaran QRIS berhasil divalidasi lunas!');
      if (res.data) {
        setSelectedOrder(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memvalidasi pembayaran');
    },
  });

  const shipMutation = useMutation({
    mutationFn: ({ id, trackingNumber, courier, notes }: { id: string; trackingNumber: string; courier: string; notes?: string }) =>
      api.updateOrderStatus(id, {
        status: 'SHIPPED',
        trackingNumber,
        shippingCourier: courier,
        adminNotes: notes || `Paket diserahkan ke ${courier} dengan nomor resi ${trackingNumber}`,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status pengiriman berhasil diperbarui menjadi Dalam Pengiriman!');
      if (res.data) {
        setSelectedOrder(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui status pengiriman');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.updateOrderStatus(id, { status: 'COMPLETED' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pesanan ditandai telah selesai diterima customer.');
      if (res.data) {
        setSelectedOrder(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyelesaikan pesanan');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => api.createManualOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pesanan manual berhasil dibuat.');
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membuat pesanan manual.');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateOrder(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Data pesanan berhasil diperbarui.');
      setIsEditModalOpen(false);
      if (res.data) {
        setSelectedOrder(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui pesanan.');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => api.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pesanan berhasil dihapus.');
      setCurrentView('list');
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus pesanan.');
    },
  });

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setTrackingNumber(order.trackingNumber || '');
    setCourier(order.shippingCourier || 'JNE YES');
    setAdminNotes(order.adminNotes || '');
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreateModal = () => {
    setSelectedAccountUserId('');
    setManualCustomerName('');
    setManualCustomerEmail('');
    setManualCustomerPhone('');
    setManualAddress('');
    setManualCity('Jakarta Selatan');
    setManualPostal('12190');
    setManualCourier('JNE YES');
    setManualPerfumeSlug(perfumes[0]?.slug || 'vetiver-obscura');
    setManualQuantity('1');
    setManualPaymentStatus('PROCESSING');
    setManualAdminNotes('Pesanan diinput manual oleh Admin Concierge.');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (order: any) => {
    setEditingOrder(order);
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

  const handleDeleteOrder = (order: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pesanan #${order.orderNumber} ini secara permanen? Data yang dihapus tidak dapat dipulihkan.`)) {
      deleteOrderMutation.mutate(order.id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomerName.trim() || !manualCustomerEmail.trim()) {
      toast.error('Nama dan email pemesan wajib diisi.');
      return;
    }

    const perfume = perfumes.find((p: any) => p.slug === manualPerfumeSlug) || perfumes[0];
    if (!perfume) {
      toast.error('Pilih parfum terlebih dahulu.');
      return;
    }

    createOrderMutation.mutate({
      customerName: manualCustomerName.trim(),
      customerEmail: manualCustomerEmail.trim(),
      customerPhone: manualCustomerPhone.trim(),
      shippingAddress: manualAddress.trim() || 'Alamat dikonfirmasi via WhatsApp / Admin',
      shippingCity: manualCity.trim(),
      shippingPostal: manualPostal.trim(),
      shippingCourier: manualCourier.trim(),
      paymentStatus: manualPaymentStatus,
      adminNotes: manualAdminNotes.trim(),
      items: [
        {
          name: perfume.name,
          volume: perfume.volume || '50 ml',
          quantity: Number(manualQuantity) || 1,
          unitPrice: perfume.price,
          fragranceId: perfume.id,
        },
      ],
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrderMutation.mutate({
      id: editingOrder.id,
      data: editFormData,
    });
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

  // ---------------------------------------------------------------------------
  // SUB-VIEW: FAKTUR INVOICE RESMI (SATU HALAMAN RAPI)
  // ---------------------------------------------------------------------------
  if (viewInvoice && selectedOrder) {
    return (
      <PrintableInvoice
        order={selectedOrder}
        onBack={() => setViewInvoice(false)}
        backLabel="Kembali ke Detail Pesanan Admin"
      />
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-VIEW: HALAMAN DETAIL PESANAN PENUH (DILENGKAPI EDIT & HAPUS)
  // ---------------------------------------------------------------------------
  if (currentView === 'detail' && selectedOrder) {
    const gps = getGpsFromAddress(selectedOrder.shippingAddress);
    const googleMapsUrl = gps
      ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          selectedOrder.shippingAddress || selectedOrder.shippingCity || 'Indonesia'
        )}`;

    const cleanAddress = selectedOrder.shippingAddress
      ? selectedOrder.shippingAddress.replace(/\[GPS:\s*[^\]]+\]/, '').trim().replace(/,\s*$/, '')
      : '-';

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Navigation Bar & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pesanan</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenEditModal(selectedOrder)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/30 hover:bg-surface text-ink transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-accent" />
              <span>Edit Pesanan</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeleteOrder(selectedOrder)}
              disabled={deleteOrderMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Pesanan</span>
            </button>

            <button
              type="button"
              onClick={() => setViewInvoice(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/30 hover:bg-surface text-ink transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Lihat & Cetak Faktur (1 Halaman)</span>
            </button>

            <span className="text-[0.65rem] font-mono text-muted uppercase ml-2">
              ID: {selectedOrder.id}
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
                {new Date(selectedOrder.createdAt).toLocaleString('id-ID', {
                  dateStyle: 'full',
                  timeStyle: 'medium',
                })}
              </span>
            </div>
            <h2 className="font-mono text-3xl font-bold text-ink mt-1">
              #{selectedOrder.orderNumber}
            </h2>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2">
            <div>{getStatusBadge(selectedOrder.status)}</div>
            <p className="font-mono text-xl font-bold text-ink">
              Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* SECTION 1: PETA LOKASI PENGIRIMAN & SHARELOC (GOOGLE MAPS) */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <h3 className="font-display text-lg text-ink font-normal">
                Titik Peta Lokasi Pengiriman & Rute Kurir (Shareloc)
              </h3>
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

          {/* Interactive Map Embed */}
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
                    Customer belum membagikan koordinat GPS saat checkout, atau alamat dikonfirmasi lewat komunikasi manual.
                  </p>
                </div>
              )}
            </div>

            {/* Address Details */}
            <div className="lg:col-span-5 space-y-3">
              <div className="border border-line bg-surface/30 p-4 space-y-2 text-xs">
                <span className="text-[0.62rem] uppercase font-bold tracking-wider text-accent block">
                  Detail Alamat Tujuan
                </span>
                <p className="font-medium text-ink leading-relaxed text-sm">{cleanAddress}</p>
                <div className="pt-2 border-t border-line text-muted space-y-1">
                  <p>Kota/Kab: <strong className="text-ink">{selectedOrder.shippingCity || 'Jakarta'}</strong></p>
                  <p>Kode Pos: <strong className="font-mono text-ink">{selectedOrder.shippingPostal || '-'}</strong></p>
                  <p>Kurir Dipilih: <strong className="text-ink">{selectedOrder.shippingCourier || 'JNE REG'}</strong></p>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="border border-line bg-surface/30 p-4 space-y-2 text-xs">
                <span className="text-[0.62rem] uppercase font-bold tracking-wider text-muted block">
                  Penerima & Kontak
                </span>
                <p className="font-bold text-ink text-sm">{selectedOrder.customerName}</p>
                <p className="text-muted">{selectedOrder.customerEmail}</p>
                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <span className="font-mono text-ink font-semibold">{selectedOrder.customerPhone}</span>
                  {selectedOrder.customerPhone && (
                    <a
                      href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}`}
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

        {/* SECTION 2: BUKTI TRANSFER & AKSI VALIDASI PEMBAYARAN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 border border-line bg-surface/20 p-6 space-y-4">
            <h3 className="font-display text-lg text-ink font-normal border-b border-line pb-3">
              Bukti Transfer & Pembayaran
            </h3>

            {selectedOrder.paymentProofUrl ? (
              <div className="space-y-3">
                <div className="border border-line rounded overflow-hidden max-h-80 bg-black/20 flex items-center justify-center">
                  <img
                    src={selectedOrder.paymentProofUrl}
                    alt="Bukti Transfer Pembeli"
                    className="object-contain max-h-80 w-auto"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <a
                    href={selectedOrder.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Ukuran Penuh di Tab Baru ↗</span>
                  </a>
                  {selectedOrder.paymentProofNote && (
                    <span className="text-muted italic">"{selectedOrder.paymentProofNote}"</span>
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

          {/* Action: Validation Button */}
          <div className="lg:col-span-6 border border-line bg-surface/20 p-6 space-y-4">
            <h3 className="font-display text-lg text-ink font-normal border-b border-line pb-3">
              Aksi Kelola Pesanan
            </h3>

            {selectedOrder.status === 'AWAITING_VALIDATION' && (
              <div className="p-4 border border-amber-600/30 bg-amber-950/20 text-amber-300 space-y-3">
                <p className="text-xs">
                  Customer telah mengunggah bukti transfer. Silakan periksa kebenaran mutasi rekening atau QRIS atelier sebelum memvalidasi.
                </p>
                <Button
                  variant="primary"
                  icon={<CheckCircle2 className="w-4 h-4 text-accent" />}
                  isLoading={validateMutation.isPending}
                  onClick={() => validateMutation.mutate({ id: selectedOrder.id })}
                >
                  Validasi Pembayaran Lunas & Mulai Peracikan
                </Button>
              </div>
            )}

            {/* Aksi Form Input Resi */}
            {(selectedOrder.status === 'PROCESSING' || selectedOrder.status === 'SHIPPED') && (
              <div className="border border-line bg-surface/20 p-5 space-y-4">
                <h4 className="font-display text-base text-ink font-normal">
                  {selectedOrder.status === 'PROCESSING' ? 'Serahkan ke Kurir & Terbitkan Resi' : 'Informasi Resi Pelacakan Kurir'}
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
                  placeholder="Paket telah dikemas rapi dengan segel wax dan diserahkan ke kurir..."
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
                      shipMutation.mutate({
                        id: selectedOrder.id,
                        trackingNumber: trackingNumber.trim(),
                        courier: courier.trim(),
                        notes: adminNotes.trim(),
                      });
                    }}
                  >
                    {selectedOrder.status === 'PROCESSING' ? 'Terbitkan Resi & Tandai Dikirim' : 'Perbarui Data Resi'}
                  </Button>

                  {selectedOrder.status === 'SHIPPED' && (
                    <Button
                      variant="secondary"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      isLoading={completeMutation.isPending}
                      onClick={() => completeMutation.mutate(selectedOrder.id)}
                    >
                      Tandai Pesanan Selesai (Diterima Customer)
                    </Button>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.status === 'COMPLETED' && (
              <div className="p-4 border border-emerald-600/30 bg-emerald-950/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Seluruh rangkaian pemesanan telah selesai dan sampai ke tangan pelanggan dengan baik.</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: TIMELINE RINGKAS ALA SHOPEE */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <h3 className="font-display text-lg text-ink font-normal border-b border-line pb-3">
            Timeline Perkembangan Pesanan
          </h3>

          <StatusStepper
            currentStatus={selectedOrder.status}
            trackingNumber={selectedOrder.trackingNumber}
            courier={selectedOrder.shippingCourier}
            createdAt={selectedOrder.createdAt}
            validatedAt={selectedOrder.validatedAt}
            updatedAt={selectedOrder.updatedAt}
            paymentProofUrl={selectedOrder.paymentProofUrl}
            paymentMethod={selectedOrder.paymentMethod}
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW UTAMA: DAFTAR PESANAN
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Filter bar & Tambah Pesanan Manual Button */}
      <div className="border border-line bg-surface/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink font-normal">Manajemen & Validasi Pesanan</h2>
          <p className="text-xs text-muted mt-0.5">
            Verifikasi bukti transfer QRIS, koordinat rute GPS kurir, dan nomor resi pengiriman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Tambah Pesanan Manual */}
          <a
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-bg text-xs uppercase tracking-wider font-semibold hover:bg-ink/80 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span>Tambah Pesanan Manual</span>
          </a>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-1">
            {[
              { label: 'Semua', value: '' },
              { label: 'Menunggu Validasi', value: 'AWAITING_VALIDATION' },
              { label: 'Diproses', value: 'PROCESSING' },
              { label: 'Dikirim', value: 'SHIPPED' },
              { label: 'Selesai', value: 'COMPLETED' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1 text-xs uppercase tracking-[0.08em] font-medium border transition-colors cursor-pointer ${
                  statusFilter === f.value
                    ? 'bg-ink text-bg border-ink'
                    : 'bg-bg text-muted border-line hover:border-ink hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Table
        headers={['Nomor & Tanggal', 'Pemesan & Kontak', 'Item Pesanan', 'Total', 'Shareloc GPS', 'Bukti Bayar', 'Status', 'Aksi']}
        isEmpty={orders.length === 0}
      >
        {orders.map((o: any) => {
          const gps = getGpsFromAddress(o.shippingAddress);

          return (
            <tr
              key={o.id}
              onClick={() => {
                window.location.href = `/admin/orders/${o.id}`;
              }}
              className="hover:bg-surface/30 transition-colors cursor-pointer group"
            >
              {/* Number & Date */}
              <td className="py-4 px-4 whitespace-nowrap">
                <p className="font-mono font-medium text-ink">{o.orderNumber}</p>
                <p className="text-[0.65rem] text-muted mt-0.5">
                  {new Date(o.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </td>

              {/* Customer */}
              <td className="py-4 px-4">
                <p className="font-semibold text-ink leading-tight">{o.customerName}</p>
                <p className="font-mono text-muted text-[0.68rem]">{o.customerPhone}</p>
              </td>

              {/* Items */}
              <td className="py-4 px-4 text-xs">
                {(o.items || []).map((it: any, i: number) => (
                  <p key={i} className="text-ink font-medium leading-tight">
                    {it.quantity}x {it.name}
                  </p>
                ))}
              </td>

              {/* Total */}
              <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-ink">
                Rp {o.totalAmount.toLocaleString('id-ID')}
              </td>

              {/* Shareloc GPS */}
              <td className="py-4 px-4 whitespace-nowrap">
                {gps ? (
                  <a
                    href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[0.68rem] uppercase font-semibold text-accent hover:underline"
                    title="Buka rute pengiriman di Google Maps"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ada Peta GPS ↗</span>
                  </a>
                ) : (
                  <span className="text-xs text-muted">-</span>
                )}
              </td>

              {/* Payment Proof */}
              <td className="py-4 px-4 whitespace-nowrap">
                {o.paymentProofUrl ? (
                  <a
                    href={o.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Lihat Bukti</span>
                  </a>
                ) : (
                  <span className="text-xs text-muted">Belum ada</span>
                )}
              </td>

              {/* Status */}
              <td className="py-4 px-4 whitespace-nowrap">
                {getStatusBadge(o.status)}
              </td>

              {/* Action Buttons: Detail, Edit, Hapus */}
              <td className="py-4 px-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`/admin/orders/${o.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-ink text-bg hover:bg-ink/80 transition-colors cursor-pointer"
                    title="Buka halaman penuh detail pesanan"
                  >
                    <Eye className="w-3 h-3 text-accent" />
                    <span>Detail & Kelola</span>
                  </a>

                  <a
                    href={`/admin/orders/${o.id}/edit`}
                    className="p-1.5 border border-line hover:border-accent text-muted hover:text-ink transition-colors cursor-pointer inline-flex items-center"
                    title="Edit pesanan"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(o)}
                    className="p-1.5 border border-line hover:border-red-500 text-muted hover:text-red-400 transition-colors cursor-pointer"
                    title="Hapus pesanan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
};
