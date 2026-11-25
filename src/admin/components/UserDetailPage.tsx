import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { AdminLayout } from './AdminLayout';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { Badge } from '../../components/ui/react/Badge';
import { Modal } from '../../components/ui/react/Modal';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface UserDetailPageProps {
  userId: string;
}

const UserDetailContent: React.FC<UserDetailPageProps> = ({ userId }) => {
  const queryClient = useQueryClient();

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
    memberStatus: 'NONE',
    memberTier: '',
    password: '',
  });

  // Fetch single user detail
  const { data: userDetailData, isLoading, isError } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => api.getUserDetail(userId),
    enabled: !!userId,
  });

  const user = userDetailData?.data;

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Data pengguna berhasil diperbarui.');
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui pengguna.');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Pengguna baru berhasil ditambahkan.');
      setIsAddUserModalOpen(false);
      if (res?.data?.id) {
        window.location.href = `/admin/users/${res.data.id}`;
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menambahkan pengguna.');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => api.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Pengguna berhasil dihapus.');
      window.location.href = '/admin?tab=customers';
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus pengguna.');
    },
  });

  const handleOpenEditModal = () => {
    if (!user) return;
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'CUSTOMER',
      memberStatus: user.memberStatus || 'NONE',
      memberTier: user.memberTier || '',
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'CUSTOMER',
      memberStatus: 'NONE',
      memberTier: '',
      password: '',
    });
    setIsAddUserModalOpen(true);
  };

  const handleDeleteUser = () => {
    if (!user) return;
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}" secara permanen? Seluruh riwayat transaksi akan tetap disimpan di sistem.`)) {
      deleteUserMutation.mutate();
    }
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
        Memuat detail profil pengguna...
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-bg p-8 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-medium text-ink">Pengguna tidak ditemukan</p>
        <a
          href="/admin?tab=customers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-bg text-xs uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Data User</span>
        </a>
      </div>
    );
  }

  const userOrders = user.orders || [];

  return (
    <AdminLayout activeTab="customers" breadcrumb={user?.name || 'Detail Pengguna'}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Navigation & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <a
            href="/admin?tab=customers"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar User</span>
          </a>

        {/* Action Buttons: Tambah User, Edit User, Hapus User */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/40 hover:bg-surface text-ink transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-accent" />
            <span>Tambah User Baru</span>
          </button>

          <button
            type="button"
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/40 hover:bg-surface text-ink transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-accent" />
            <span>Edit User</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteUser}
            disabled={deleteUserMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus User</span>
          </button>

          <span className="text-[0.65rem] font-mono uppercase text-muted ml-2">
            ID: {user.id}
          </span>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="border border-line bg-surface/20 p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full border border-line bg-surface flex items-center justify-center font-display text-2xl font-light text-ink shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl text-ink font-normal">
                  {user.name}
                </h1>
                {user.memberTier ? (
                  <span className="px-2 py-0.5 text-[0.62rem] uppercase font-semibold bg-accent-fill/20 border border-accent/40 text-ink">
                    {user.memberTier === 'Collector' ? 'Collector VIP' : user.memberTier}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[0.62rem] uppercase font-semibold bg-muted/10 border border-muted/30 text-muted">
                    {user.role}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-muted" />
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  Terdaftar sejak{' '}
                  {new Date(user.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & WhatsApp Chat */}
          <div className="flex flex-wrap items-center gap-6 self-start md:self-auto border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[0.6rem] uppercase tracking-wider text-muted block">
                Total Transaksi
              </span>
              <span className="font-display text-2xl font-bold text-ink">
                {user.totalOrders} Pesanan
              </span>
            </div>

            <div>
              <span className="text-[0.6rem] uppercase tracking-wider text-muted block">
                Total Belanja
              </span>
              <span className="font-mono text-2xl font-bold text-ink">
                Rp {(user.totalSpent || 0).toLocaleString('id-ID')}
              </span>
            </div>

            {user.phone && (
              <a
                href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.08em] bg-emerald-600/10 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600/20 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Hubungi via WA</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* User's Order & Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <h2 className="font-display text-xl text-ink font-normal">
              Riwayat Seluruh Pesanan ({userOrders.length})
            </h2>
          </div>
        </div>

        {userOrders.length === 0 ? (
          <div className="border border-line bg-surface/10 p-8 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-muted mx-auto opacity-50" />
            <p className="text-sm text-ink font-medium">Belum ada riwayat transaksi</p>
            <p className="text-xs text-muted">Customer ini belum pernah memesan wewangian.</p>
          </div>
        ) : (
          <div className="border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface/40 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted">
                    <th className="p-3.5">No. Pesanan</th>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Item Pesanan</th>
                    <th className="p-3.5">Total Biaya</th>
                    <th className="p-3.5">Metode Bayar</th>
                    <th className="p-3.5">Status Pesanan</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {userOrders.map((ord: any) => {
                    const itemsDesc = (ord.items || [])
                      .map((it: any) => `${it.quantity}x ${it.name}`)
                      .join(', ') || '1x Fragrance Flacon';

                    return (
                      <tr key={ord.id} className="hover:bg-surface/20 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-ink">
                          #{ord.orderNumber}
                        </td>
                        <td className="p-3.5 text-muted">
                          {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-ink">
                          {itemsDesc}
                        </td>
                        <td className="p-3.5 font-mono font-medium text-ink">
                          Rp {ord.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5 text-muted uppercase text-[0.68rem]">
                          {ord.paymentMethod}
                        </td>
                        <td className="p-3.5">
                          {getStatusBadge(ord.status)}
                        </td>
                        <td className="p-3.5 text-right">
                          <a
                            href={`/admin/orders/${ord.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-ink text-bg hover:bg-ink/80 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-accent" />
                            <span>Lihat Tracker & Detail</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit User */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Pengguna"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateUserMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <Input
            label="Nama Lengkap"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Pengguna"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Peran (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              >
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Status Member
              </label>
              <select
                value={formData.memberStatus}
                onChange={(e) => setFormData({ ...formData, memberStatus: e.target.value })}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              >
                <option value="NONE">NONE</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>

            <Input
              label="Tier Member"
              value={formData.memberTier}
              onChange={(e) => setFormData({ ...formData, memberTier: e.target.value })}
            />
          </div>

          <Input
            label="Ubah Password (Kosongkan jika tidak diubah)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={updateUserMutation.isPending}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah User Baru */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Tambah Pengguna Baru"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createUserMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <Input
            label="Nama Lengkap"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Raden Mas Danang"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Pengguna"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="danang@omoo.studio"
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081234567890"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Peran (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              >
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block">
                Status Member
              </label>
              <select
                value={formData.memberStatus}
                onChange={(e) => setFormData({ ...formData, memberStatus: e.target.value })}
                className="w-full bg-surface/40 border border-line px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              >
                <option value="NONE">NONE</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>

            <Input
              label="Tier Member"
              value={formData.memberTier}
              onChange={(e) => setFormData({ ...formData, memberTier: e.target.value })}
              placeholder="Member atau Collector"
            />
          </div>

          <Input
            label="Password Akun (Opsional)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimal 6 karakter"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setIsAddUserModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={createUserMutation.isPending}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  </AdminLayout>
  );
};

export const UserDetailPage: React.FC<UserDetailPageProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <UserDetailContent {...props} />
    </QueryClientProvider>
  );
};
