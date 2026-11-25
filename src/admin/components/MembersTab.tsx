import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { Modal } from '../../components/ui/react/Modal';
import {
  Award,
  Search,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Sliders,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const STATUS_OPTIONS = [
  { id: 'PROCESSING', label: 'Sedang Diproses / Lunas QRIS' },
  { id: 'SHIPPED', label: 'Sedang Dikirim Kurir' },
  { id: 'COMPLETED', label: 'Pesanan Selesai' },
];

const THRESHOLD_PRESETS = [1_500_000, 2_500_000, 3_500_000, 5_000_000];

export const MembersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [tierFilter, setTierFilter] = useState<'ALL' | 'Collector' | 'Member'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [configForm, setConfigForm] = useState<any>({
    vipThreshold: 2_500_000,
    memberTierLabel: 'Member',
    vipTierLabel: 'Collector VIP',
    autoUpgradeEnabled: true,
    qualifyingStatuses: ['PROCESSING', 'SHIPPED', 'COMPLETED'],
    benefits: [],
  });

  const { data: membersRes, isLoading, refetch } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => api.getMembers(),
  });

  const { data: configRes } = useQuery({
    queryKey: ['loyalty-config'],
    queryFn: () => api.getLoyaltyConfig(),
  });

  useEffect(() => {
    if (configRes?.data) {
      setConfigForm(configRes.data);
    }
  }, [configRes]);

  const updateTierMutation = useMutation({
    mutationFn: ({ id, memberTier }: { id: string; memberTier: 'Member' | 'Collector' }) =>
      api.updateMemberTier(id, memberTier),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Tier member berhasil diperbarui.');
        queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      } else {
        toast.error(res.message || 'Gagal memperbarui tier member.');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: (payload: any) => api.updateLoyaltyConfig(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Aturan Collector VIP berhasil disimpan.');
        queryClient.invalidateQueries({ queryKey: ['loyalty-config'] });
        queryClient.invalidateQueries({ queryKey: ['admin-members'] });
        setIsConfigOpen(false);
      } else {
        toast.error(res.message || 'Gagal menyimpan aturan.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const members: any[] = membersRes?.data || [];
  const activeConfig = membersRes?.config || configRes?.data || configForm;
  const threshold: number = activeConfig?.vipThreshold ?? membersRes?.threshold ?? 2_500_000;
  const vipLabel: string = activeConfig?.vipTierLabel || 'Collector VIP';
  const memberLabel: string = activeConfig?.memberTierLabel || 'Member';

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesTier = tierFilter === 'ALL' || m.memberTier === tierFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q);
      return matchesTier && matchesQuery;
    });
  }, [members, tierFilter, searchQuery]);

  const collectorCount = members.filter((m) => m.memberTier === 'Collector').length;
  const regularCount = members.length - collectorCount;
  const totalMemberSpend = members.reduce((sum, m) => sum + (Number(m.totalSpent) || 0), 0);

  const toggleStatusRule = (statusId: string) => {
    const current: string[] = configForm.qualifyingStatuses || [];
    const exists = current.includes(statusId);
    const next = exists ? current.filter((s) => s !== statusId) : [...current, statusId];
    if (next.length === 0) {
      toast.error('Minimal harus ada 1 status pesanan yang dihitung.');
      return;
    }
    setConfigForm({ ...configForm, qualifyingStatuses: next });
  };

  const updateBenefit = (idx: number, patch: any) => {
    const next = [...(configForm.benefits || [])];
    next[idx] = { ...next[idx], ...patch };
    setConfigForm({ ...configForm, benefits: next });
  };

  const addBenefit = () => {
    setConfigForm({
      ...configForm,
      benefits: [
        ...(configForm.benefits || []),
        {
          id: `custom-${Date.now()}`,
          label: '',
          description: '',
          vipOnly: true,
          enabled: true,
        },
      ],
    });
  };

  const removeBenefit = (idx: number) => {
    setConfigForm({
      ...configForm,
      benefits: (configForm.benefits || []).filter((_: any, i: number) => i !== idx),
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted text-xs uppercase tracking-[0.1em]">
        Memuat data member & loyalty...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h3 className="font-display text-2xl font-light text-ink">
            Member & Loyalty Tiers
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {activeConfig?.autoUpgradeEnabled !== false
              ? `Kenaikan tier ${vipLabel} otomatis aktif saat total belanja tervalidasi mencapai ${formatRupiah(threshold)}.`
              : `Mode upgrade otomatis sedang nonaktif — penetapan ${vipLabel} dilakukan manual oleh admin.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-line bg-surface/40 hover:bg-surface text-xs uppercase tracking-wider text-ink transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted" />
            <span>Muat Ulang</span>
          </button>

          <Button
            onClick={() => {
              if (configRes?.data) setConfigForm(configRes.data);
              setIsConfigOpen(true);
            }}
            icon={<Sliders className="w-4 h-4 text-accent" />}
          >
            Aturan Collector VIP
          </Button>
        </div>
      </div>

      {/* Active Rules Summary Strip */}
      <div className="border border-line bg-surface/25 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-muted uppercase tracking-wider text-[0.62rem] block">
              Target Belanja {vipLabel}
            </span>
            <strong className="text-ink font-semibold text-sm">{formatRupiah(threshold)}</strong>
          </div>
          <div>
            <span className="text-muted uppercase tracking-wider text-[0.62rem] block">
              Upgrade Otomatis
            </span>
            <strong className="text-ink font-semibold">
              {activeConfig?.autoUpgradeEnabled !== false ? 'Aktif' : 'Manual'}
            </strong>
          </div>
          <div>
            <span className="text-muted uppercase tracking-wider text-[0.62rem] block">
              Benefit Aktif
            </span>
            <strong className="text-ink font-semibold">
              {(activeConfig?.benefits || []).filter((b: any) => b.enabled).length} hak istimewa
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (configRes?.data) setConfigForm(configRes.data);
            setIsConfigOpen(true);
          }}
          className="text-xs font-semibold uppercase tracking-[0.1em] text-accent hover:underline cursor-pointer self-start md:self-auto"
        >
          Sesuaikan Aturan &rarr;
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-line bg-surface/20 p-4 space-y-1">
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted font-semibold">
            {vipLabel}
          </span>
          <p className="font-display text-2xl text-ink">{collectorCount}</p>
          <p className="text-[0.68rem] text-accent">Gratis ongkir & benefit VIP aktif</p>
        </div>

        <div className="border border-line bg-surface/20 p-4 space-y-1">
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted font-semibold">
            {memberLabel}
          </span>
          <p className="font-display text-2xl text-ink">{regularCount}</p>
          <p className="text-[0.68rem] text-muted">Akun terdaftar aktif</p>
        </div>

        <div className="border border-line bg-surface/20 p-4 space-y-1">
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted font-semibold">
            Akumulasi Belanja Member
          </span>
          <p className="font-display text-2xl text-ink">{formatRupiah(totalMemberSpend)}</p>
          <p className="text-[0.68rem] text-muted">Dari transaksi sesuai aturan</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: `Semua (${members.length})` },
            { id: 'Collector', label: `${vipLabel} (${collectorCount})` },
            { id: 'Member', label: `${memberLabel} (${regularCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTierFilter(tab.id as any)}
              className={`px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.1em] font-semibold border transition-colors cursor-pointer ${
                tierFilter === tab.id
                  ? 'border-ink bg-ink text-bg'
                  : 'border-line bg-surface/30 text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full bg-surface/30 border border-line pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-line bg-surface/20 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-line bg-surface/60 text-muted uppercase tracking-[0.08em] text-[0.65rem]">
              <th className="py-3 px-4 font-semibold">Member</th>
              <th className="py-3 px-4 font-semibold">Belanja Tervalidasi</th>
              <th className="py-3 px-4 font-semibold">Progres {vipLabel}</th>
              <th className="py-3 px-4 font-semibold">Tier</th>
              <th className="py-3 px-4 font-semibold text-right">Penyesuaian Manual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredMembers.map((m: any) => {
              const isCollector = m.memberTier === 'Collector';
              return (
                <tr key={m.id} className="hover:bg-surface/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-ink">{m.name}</div>
                    <div className="text-[0.68rem] text-muted">{m.email}</div>
                    {m.phone && m.phone !== '-' && (
                      <div className="text-[0.65rem] text-muted">{m.phone}</div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-ink">{formatRupiah(m.totalSpent)}</div>
                    <div className="text-[0.65rem] text-muted">
                      {m.paidOrdersCount} pesanan lunas
                    </div>
                  </td>

                  <td className="py-3.5 px-4 min-w-[150px]">
                    <div className="flex items-center justify-between text-[0.65rem] text-muted mb-1">
                      <span>{m.progressPercent}%</span>
                      <span>{formatRupiah(threshold)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface border border-line overflow-hidden">
                      <div
                        className={`h-full ${isCollector ? 'bg-accent' : 'bg-ink/70'}`}
                        style={{ width: `${m.progressPercent}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {isCollector ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider bg-accent-fill/25 text-ink border border-accent">
                        <Award className="w-3 h-3 text-accent" />
                        <span>{vipLabel}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-wider bg-surface text-muted border border-line">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{memberLabel}</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={updateTierMutation.isPending}
                      onClick={() =>
                        updateTierMutation.mutate({
                          id: m.id,
                          memberTier: isCollector ? 'Member' : 'Collector',
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-line bg-bg hover:border-ink text-[0.65rem] uppercase tracking-wider font-semibold text-ink transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span>{isCollector ? `Set ${memberLabel}` : `Jadikan ${vipLabel}`}</span>
                      <ArrowUpRight className="w-3 h-3 text-accent" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted text-xs">
                  Tidak ada data member yang sesuai filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Aturan Membership & Collector VIP */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Pengaturan Aturan Membership & Collector VIP"
        subtitle="Sesuaikan batas minimum belanja, nama tier, status pesanan yang dihitung, dan benefit otomatis."
        maxWidth="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveConfigMutation.mutate(configForm);
          }}
          className="space-y-6"
        >
          {/* Threshold & Presets */}
          <div className="space-y-3 border border-line bg-surface/20 p-4">
            <Input
              label="Minimum Akumulasi Belanja untuk Collector VIP (IDR) *"
              type="number"
              min={0}
              step={50000}
              value={configForm.vipThreshold}
              onChange={(e) =>
                setConfigForm({ ...configForm, vipThreshold: Number(e.target.value) || 0 })
              }
              helperText={`Saat ini: ${formatRupiah(Number(configForm.vipThreshold) || 0)}`}
              required
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] uppercase tracking-wider text-muted font-semibold">
                Preset Cepat:
              </span>
              {THRESHOLD_PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, vipThreshold: val })}
                  className={`px-2.5 py-1 text-[0.65rem] border transition-colors cursor-pointer ${
                    Number(configForm.vipThreshold) === val
                      ? 'border-ink bg-ink text-bg font-semibold'
                      : 'border-line bg-bg text-muted hover:text-ink'
                  }`}
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Tier Display Names & Auto Upgrade Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Label Tier Reguler"
              value={configForm.memberTierLabel}
              onChange={(e) =>
                setConfigForm({ ...configForm, memberTierLabel: e.target.value })
              }
              placeholder="Member"
            />
            <Input
              label="Label Tier VIP"
              value={configForm.vipTierLabel}
              onChange={(e) =>
                setConfigForm({ ...configForm, vipTierLabel: e.target.value })
              }
              placeholder="Collector VIP"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-line bg-surface/15 p-4">
            <div className="space-y-2">
              <span className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold text-muted block">
                Otomatisasi Kenaikan Tier
              </span>
              <label className="flex items-start gap-2.5 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(configForm.autoUpgradeEnabled)}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, autoUpgradeEnabled: e.target.checked })
                  }
                  className="w-4 h-4 mt-0.5 accent-ink"
                />
                <span>
                  Otomatis naikkan ke <strong>{configForm.vipTierLabel || 'Collector VIP'}</strong>{' '}
                  saat total belanja tervalidasi mencapai target
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold text-muted block">
                Status Pesanan yang Dihitung
              </span>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.map((st) => (
                  <label key={st.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(configForm.qualifyingStatuses || []).includes(st.id)}
                      onChange={() => toggleStatusRule(st.id)}
                      className="w-3.5 h-3.5 accent-ink"
                    />
                    <span>{st.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <span className="text-[0.68rem] uppercase tracking-[0.12em] font-semibold text-ink block">
                  Daftar Benefit Membership
                </span>
                <span className="text-[0.68rem] text-muted">
                  Tampil di halaman /member & ringkasan benefit customer.
                </span>
              </div>
              <button
                type="button"
                onClick={addBenefit}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-line bg-surface hover:border-ink text-[0.65rem] font-semibold uppercase tracking-wider text-ink cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                <span>Tambah Benefit</span>
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(configForm.benefits || []).map((b: any, idx: number) => (
                <div key={b.id || idx} className="border border-line bg-surface/20 p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={b.enabled !== false}
                          onChange={(e) => updateBenefit(idx, { enabled: e.target.checked })}
                          className="w-3.5 h-3.5 accent-ink"
                        />
                        <span>Aktif</span>
                      </label>

                      <select
                        value={b.vipOnly ? 'VIP' : 'ALL'}
                        onChange={(e) =>
                          updateBenefit(idx, { vipOnly: e.target.value === 'VIP' })
                        }
                        className="bg-bg border border-line px-2 py-1 text-[0.68rem] text-ink"
                      >
                        <option value="ALL">Semua ({configForm.memberTierLabel || 'Member'})</option>
                        <option value="VIP">Khusus {configForm.vipTierLabel || 'Collector VIP'}</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBenefit(idx)}
                      className="text-muted hover:text-red-700 p-1 cursor-pointer"
                      title="Hapus benefit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={b.label}
                      onChange={(e) => updateBenefit(idx, { label: e.target.value })}
                      placeholder="Judul benefit..."
                      className="w-full bg-bg border border-line px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-ink"
                      required
                    />
                    <input
                      type="text"
                      value={b.description}
                      onChange={(e) => updateBenefit(idx, { description: e.target.value })}
                      placeholder="Deskripsi singkat benefit..."
                      className="w-full bg-bg border border-line px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsConfigOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={saveConfigMutation.isPending}>
              Simpan Aturan Membership
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
