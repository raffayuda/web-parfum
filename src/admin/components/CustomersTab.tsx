import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { Badge } from '../../components/ui/react/Badge';
import { Table } from '../../components/ui/react/Table';
import { Modal } from '../../components/ui/react/Modal';
import { StatusStepper } from '../../components/ui/react/StatusStepper';
import { toast } from 'sonner';
import {
  Users,
  Search,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Truck,
  Plus,
  Edit,
  Trash2,
  UserPlus,
} from 'lucide-react';

export const CustomersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Dedicated view for a specific order clicked inside customer detail (no modal)
  const [trackerOrder, setTrackerOrder] = useState<any>(null);

  // Modal States: Create / Edit User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
    memberStatus: 'NONE',
    memberTier: '',
    password: '',
  });

  const getGpsFromAddress = (address: string) => {
    if (!address) return null;
    const match = address.match(/\[GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  // Fetch list of users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users', searchTerm],
    queryFn: () => api.getUsers({ search: searchTerm }),
  });

  // Fetch detail of selected user
  const { data: userDetailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => (selectedUserId ? api.getUserDetail(selectedUserId) : null),
    enabled: !!selectedUserId,
  });

  const users = usersData?.data || [];
  const selectedUser = userDetailData?.data;

  // Mutations: Create, Update, Delete User
  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Pengguna baru berhasil ditambahkan.');
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menambahkan pengguna.');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      toast.success('Data pengguna berhasil diperbarui.');
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui pengguna.');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Pengguna berhasil dihapus.');
      setSelectedUserId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus pengguna.');
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'CUSTOMER',
      memberStatus: 'NONE',
      memberTier: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'CUSTOMER',
      memberStatus: user.memberStatus || 'NONE',
      memberTier: user.memberTier || '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}" secara permanen? Riwayat pesanan akan tetap disimpan tanpa pemilik.`)) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Nama dan email wajib diisi.');
      return;
    }

    if (modalMode === 'create') {
      createUserMutation.mutate(formData);
    } else if (editingUserId) {
      updateUserMutation.mutate({ id: editingUserId, data: formData });
    }
  };

  const handleOpenTracker = (order: any) => {
    setTrackerOrder(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge variant="pending">Menunggu Bayar</Badge>;
      case 'AWAITING_VALIDATION':
        return <Badge variant="pending">Menunggu Validasi</Badge>;
      case 'PROCESSING':
        return <Badge variant="processing">Diramu & Dikemas</Badge>;
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
  // SUB-VIEW 3: TRACKER DETAIL PESANAN USER (PINDAH HALAMAN / BUKAN MODAL)
  // ---------------------------------------------------------------------------
  if (trackerOrder) {
    const gps = getGpsFromAddress(trackerOrder.shippingAddress);
    const googleMapsUrl = gps
      ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          trackerOrder.shippingAddress || trackerOrder.shippingCity || 'Indonesia'
        )}`;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => setTrackerOrder(null)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Detail Profil User</span>
          </button>

          <span className="text-[0.65rem] font-mono text-muted uppercase">
            Pesanan #{trackerOrder.orderNumber}
          </span>
        </div>

        {/* Status Header */}
        <div className="p-6 bg-surface/30 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.62rem] uppercase font-bold tracking-[0.14em] text-accent">
                Tracker Pesanan
              </span>
              <span className="text-muted text-xs">&bull;</span>
              <span className="text-xs text-muted">
                {new Date(trackerOrder.createdAt).toLocaleString('id-ID', {
                  dateStyle: 'full',
                  timeStyle: 'medium',
                })}
              </span>
            </div>
            <h3 className="font-mono text-3xl font-bold text-ink mt-1">
              #{trackerOrder.orderNumber}
            </h3>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2">
            <div>{getStatusBadge(trackerOrder.status)}</div>
            <p className="font-mono text-xl font-bold text-ink">
              Rp {trackerOrder.totalAmount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Status Stepper Timeline */}
        <div className="border border-line p-6 bg-surface/20 space-y-4">
          <h4 className="font-display text-lg text-ink font-normal border-b border-line pb-3">
            Timeline Riwayat Status Pesanan
          </h4>
          <StatusStepper
            currentStatus={trackerOrder.status}
            trackingNumber={trackerOrder.trackingNumber}
            courier={trackerOrder.shippingCourier}
            createdAt={trackerOrder.createdAt}
            validatedAt={trackerOrder.validatedAt}
            updatedAt={trackerOrder.updatedAt}
            paymentProofUrl={trackerOrder.paymentProofUrl}
            paymentMethod={trackerOrder.paymentMethod}
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: Detail Customer & Transaksi (DILENGKAPI TOMBOL TAMBAH, EDIT, HAPUS DI ATAS)
  // ---------------------------------------------------------------------------
  if (selectedUserId && selectedUser) {
    const userOrders = selectedUser.orders || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Navigation Bar & Header dengan Tombol Aksi Tambah, Edit, Hapus */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar User</span>
          </button>

          {/* Action Buttons: Tambah User, Edit User, Hapus User */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/30 hover:bg-surface text-ink transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span>Tambah User Baru</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenEditModal(selectedUser)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/30 hover:bg-surface text-ink transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-accent" />
              <span>Edit User</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
              disabled={deleteUserMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus User</span>
            </button>

            <span className="text-[0.65rem] font-mono uppercase text-muted ml-2">
              ID: {selectedUser.id}
            </span>
          </div>
        </div>

        {/* Customer Profile Card */}
        <div className="border border-line bg-surface/20 p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full border border-line bg-surface flex items-center justify-center font-display text-2xl font-light text-ink shrink-0">
                {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-display text-2xl text-ink font-normal">
                    {selectedUser.name}
                  </h3>
                  {selectedUser.memberTier ? (
                    <span className="px-2 py-0.5 text-[0.62rem] uppercase font-semibold bg-accent-fill/20 border border-accent/40 text-ink">
                      Cercle Privé {selectedUser.memberTier}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[0.62rem] uppercase font-semibold bg-muted/10 border border-muted/30 text-muted">
                      {selectedUser.role}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted" />
                    {selectedUser.email}
                  </span>
                  {selectedUser.phone && (
                    <span className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      {selectedUser.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    Terdaftar sejak{' '}
                    {new Date(selectedUser.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="flex flex-wrap items-center gap-4 self-start md:self-auto border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-[0.6rem] uppercase tracking-wider text-muted block">
                  Total Transaksi
                </span>
                <span className="font-display text-xl font-bold text-ink">
                  {selectedUser.totalOrders} Pesanan
                </span>
              </div>

              <div>
                <span className="text-[0.6rem] uppercase tracking-wider text-muted block">
                  Total Belanja
                </span>
                <span className="font-mono text-xl font-bold text-ink">
                  Rp {(selectedUser.totalSpent || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {selectedUser.phone && (
                <a
                  href={`https://wa.me/${selectedUser.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] bg-emerald-600/10 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600/20 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* User's Order & Transactions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent" />
              <h4 className="font-display text-lg text-ink font-normal">
                Daftar Transaksi & Riwayat Pemesanan ({userOrders.length})
              </h4>
            </div>
          </div>

          {userOrders.length === 0 ? (
            <div className="border border-line bg-surface/10 p-8 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-muted mx-auto opacity-50" />
              <p className="text-sm text-ink font-medium">Belum ada transaksi</p>
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
                            <button
                              onClick={() => handleOpenTracker(ord)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-ink text-bg hover:bg-ink/80 transition-colors cursor-pointer"
                              title="Buka pelacakan timeline pesanan"
                            >
                              <Eye className="w-3.5 h-3.5 text-accent" />
                              <span>Lihat Tracker</span>
                            </button>
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

        {/* Modal Tambah / Edit User */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'create' ? 'Tambah User / Customer Baru' : 'Edit Data Pengguna'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
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
                  <option value="NONE">NONE (Biasa)</option>
                  <option value="ACTIVE">ACTIVE (Aktif)</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <Input
                label="Tier Member"
                value={formData.memberTier}
                onChange={(e) => setFormData({ ...formData, memberTier: e.target.value })}
                placeholder="e.g. Cercle Privé"
              />
            </div>

            <Input
              label={modalMode === 'create' ? 'Password Akun (Opsional)' : 'Ubah Password (Kosongkan jika tidak diubah)'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimal 6 karakter"
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-line">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {modalMode === 'create' ? 'Simpan Pengguna' : 'Perbarui Pengguna'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 1: Master List of Users / Customers
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar + Tambah User Baru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h2 className="font-display text-2xl text-ink font-normal">
            Data User & Customer
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Daftar pengguna terdaftar di OMOO, riwayat transaksi, dan status pesanan.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, email, no WA..."
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-bg text-xs uppercase tracking-wider font-semibold hover:bg-ink/80 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      {isLoadingUsers ? (
        <div className="p-8 text-center text-xs text-muted">Memuat data user...</div>
      ) : users.length === 0 ? (
        <div className="border border-line bg-surface/10 p-8 text-center space-y-2">
          <Users className="w-8 h-8 text-muted mx-auto opacity-50" />
          <p className="text-sm text-ink font-medium">Tidak ada data user</p>
          <p className="text-xs text-muted">
            {searchTerm ? 'Tidak ditemukan user yang cocok dengan pencarian.' : 'Belum ada customer yang terdaftar.'}
          </p>
        </div>
      ) : (
        <div className="border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/40 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted">
                  <th className="p-3.5">Customer / User</th>
                  <th className="p-3.5">Kontak WhatsApp</th>
                  <th className="p-3.5">Status Member</th>
                  <th className="p-3.5">Total Pesanan</th>
                  <th className="p-3.5">Total Belanja</th>
                  <th className="p-3.5">Terdaftar Sejak</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u: any) => (
                  <tr
                    key={u.id}
                    onClick={() => {
                      window.location.href = `/admin/users/${u.id}`;
                    }}
                    className="hover:bg-surface/25 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center font-display text-sm font-light text-ink shrink-0 group-hover:border-ink transition-colors">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-ink group-hover:underline">
                            {u.name}
                          </p>
                          <p className="text-[0.68rem] text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-muted">
                      {u.phone || '-'}
                    </td>

                    <td className="p-3.5">
                      {u.memberTier ? (
                        <span className="px-2 py-0.5 text-[0.6rem] uppercase font-semibold bg-accent-fill/20 border border-accent/40 text-ink">
                          Cercle Privé {u.memberTier}
                        </span>
                      ) : u.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 text-[0.6rem] uppercase font-semibold bg-ink text-bg">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[0.6rem] uppercase font-semibold bg-muted/10 border border-muted/30 text-muted">
                          Customer
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-bold text-ink">
                      {u.totalOrders} Pesanan
                    </td>

                    <td className="p-3.5 font-mono text-ink">
                      Rp {(u.totalSpent || 0).toLocaleString('id-ID')}
                    </td>

                    <td className="p-3.5 text-muted">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className="px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider border border-line hover:border-ink text-ink transition-colors"
                          title="Lihat profil dan riwayat pesanan"
                        >
                          Detail & Tracker
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1 border border-line hover:border-accent text-muted hover:text-ink transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1 border border-line hover:border-red-500 text-muted hover:text-red-400 transition-colors"
                          title="Hapus user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah User / Customer Baru' : 'Edit Data Pengguna'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
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
                <option value="NONE">NONE (Biasa)</option>
                <option value="ACTIVE">ACTIVE (Aktif)</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>

            <Input
              label="Tier Member"
              value={formData.memberTier}
              onChange={(e) => setFormData({ ...formData, memberTier: e.target.value })}
              placeholder="e.g. Cercle Privé"
            />
          </div>

          <Input
            label={modalMode === 'create' ? 'Password Akun (Opsional)' : 'Ubah Password (Kosongkan jika tidak diubah)'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimal 6 karakter"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {modalMode === 'create' ? 'Simpan Pengguna' : 'Perbarui Pengguna'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
