import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ShoppingBag, Clock, CheckCircle2, Award, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/react/Button';

export const OverviewTab: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.getOrders(),
  });

  const { data: perfumesData } = useQuery({
    queryKey: ['admin-perfumes'],
    queryFn: () => api.getPerfumes(),
  });

  const { data: membersData } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => api.getMembers(),
  });

  const orders = ordersData?.data || [];
  const perfumes = perfumesData?.data || [];
  const members = membersData?.data || [];

  const pendingValidations = orders.filter((o: any) => o.status === 'AWAITING_VALIDATION');
  const completedOrders = orders.filter((o: any) => o.status === 'DELIVERED' || o.status === 'SHIPPED');
  const totalRevenue = orders
    .filter((o: any) => o.status !== 'CANCELLED' && o.status !== 'PENDING_PAYMENT')
    .reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);

  const availablePerfumesCount = perfumes.filter((p: any) => p.isAvailable).length;

  return (
    <div className="space-y-8">
      {/* Pending Validation Alert Banner */}
      {pendingValidations.length > 0 && (
        <div className="border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">
                Ada {pendingValidations.length} pesanan baru yang menunggu validasi pembayaran QRIS!
              </p>
              <p className="text-xs text-muted mt-0.5">
                Segera periksa bukti bayar agar pesanan dapat segera dikemas dan dikirim.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onNavigate('orders')}
            className="shrink-0"
          >
            Lihat Pesanan
          </Button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="border border-line bg-surface/30 p-5">
          <div className="flex items-center justify-between text-muted text-xs font-medium uppercase tracking-[0.08em]">
            <span>Total Pendapatan</span>
            <ShoppingBag className="w-4 h-4 text-ink" />
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-light text-ink">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-[0.68rem] text-muted">{orders.length} total pesanan masuk</p>
        </div>

        <div className="border border-line bg-surface/30 p-5">
          <div className="flex items-center justify-between text-muted text-xs font-medium uppercase tracking-[0.08em]">
            <span>Menunggu Validasi</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-light text-ink">
            {pendingValidations.length}
          </p>
          <p className="mt-1 text-[0.68rem] text-amber-700 dark:text-amber-400">Bukti transfer diunggah</p>
        </div>

        <div className="border border-line bg-surface/30 p-5">
          <div className="flex items-center justify-between text-muted text-xs font-medium uppercase tracking-[0.08em]">
            <span>Katalog Aktif</span>
            <Award className="w-4 h-4 text-accent" />
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-light text-ink">
            {availablePerfumesCount} <span className="text-sm font-sans text-muted">/ {perfumes.length}</span>
          </p>
          <p className="mt-1 text-[0.68rem] text-accent">Status ketersediaan produk</p>
        </div>

        <div className="border border-line bg-surface/30 p-5">
          <div className="flex items-center justify-between text-muted text-xs font-medium uppercase tracking-[0.08em]">
            <span>Dikirim / Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-ink" />
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-light text-ink">
            {completedOrders.length}
          </p>
          <p className="mt-1 text-[0.68rem] text-muted">{members.length} pengajuan member</p>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="border border-line bg-surface/20 p-6">
        <h4 className="font-display text-xl text-ink mb-4">Aksi Cepat Manajemen</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('orders')}
            className="text-left p-4 border border-line bg-bg hover:border-ink transition-colors flex items-center justify-between group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Validasi Pesanan</p>
              <p className="text-[0.68rem] text-muted mt-1">Cek bukti transfer & buat pesanan manual</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-ink transition-colors" />
          </button>

          <button
            onClick={() => onNavigate('catalog')}
            className="text-left p-4 border border-line bg-bg hover:border-ink transition-colors flex items-center justify-between group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Kelola Katalog & Stok</p>
              <p className="text-[0.68rem] text-muted mt-1">Ubah harga, stok, deskripsi & foto parfum</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-ink transition-colors" />
          </button>

          <button
            onClick={() => onNavigate('certificates')}
            className="text-left p-4 border border-line bg-bg hover:border-ink transition-colors flex items-center justify-between group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Cetak Sertifikat Halal & BPOM</p>
              <p className="text-[0.68rem] text-muted mt-1">Generate QR Code yang bisa di-scan Google Lens</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-ink transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
