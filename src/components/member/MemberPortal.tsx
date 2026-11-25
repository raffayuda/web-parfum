import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface LoyaltyBenefit {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

interface LoyaltySummary {
  tier: 'Member' | 'Collector';
  tierLabel?: string;
  memberTierLabel?: string;
  vipTierLabel?: string;
  isVip: boolean;
  autoUpgradeEnabled?: boolean;
  totalSpent: number;
  paidOrdersCount: number;
  threshold: number;
  remainingForVip: number;
  progressPercent: number;
  benefits: LoyaltyBenefit[];
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const MemberPortal: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyLoyalty();
      if (res.success) {
        setAuthenticated(Boolean(res.authenticated));
        setCurrentUser(res.user || null);
        setLoyalty(res.loyalty || null);
      }
    } catch {
      toast.error('Gagal memuat status loyalty.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const handleAuthChanged = () => fetchStatus();
    window.addEventListener('omoo:auth-changed', handleAuthChanged);
    return () => window.removeEventListener('omoo:auth-changed', handleAuthChanged);
  }, [fetchStatus]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto border border-line bg-surface/20 p-10 text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-accent mx-auto animate-spin" />
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Memuat status keanggotaan Anda...
        </p>
      </div>
    );
  }

  const threshold = loyalty?.threshold ?? 2_500_000;
  const totalSpent = loyalty?.totalSpent ?? 0;
  const remainingForVip = loyalty?.remainingForVip ?? threshold;
  const progressPercent = loyalty?.progressPercent ?? 0;
  const isVip = Boolean(loyalty?.isVip);
  const benefits = loyalty?.benefits ?? [];
  const memberLabel = loyalty?.memberTierLabel || 'Member';
  const vipLabel = loyalty?.vipTierLabel || 'Collector VIP';
  const activeTierLabel = loyalty?.tierLabel || (isVip ? vipLabel : memberLabel);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Card: Authenticated Loyalty Pass OR Guest Explainer */}
      {authenticated && currentUser ? (
        <div
          className={`border p-6 sm:p-8 space-y-6 ${
            isVip
              ? 'border-accent bg-accent-fill/15 shadow-xl'
              : 'border-line bg-surface/25'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-line pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] border ${
                    isVip
                      ? 'bg-accent-fill/30 text-ink border-accent'
                      : 'bg-surface text-muted border-line'
                  }`}
                >
                  {isVip ? vipLabel.toUpperCase() : `${memberLabel.toUpperCase()} AKTIF`}
                </span>
                <span className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                  Otomatis Berdasarkan Pembelian
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink pt-1">
                {currentUser.name}
              </h2>
              <p className="text-xs text-muted">{currentUser.email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fetchStatus}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-line bg-bg hover:border-ink text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-ink transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted" />
                <span>Segarkan</span>
              </button>
              <a
                href="/collection"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-bg hover:bg-ink/85 text-[0.68rem] font-semibold uppercase tracking-[0.1em] transition-colors"
              >
                <span>Belanja Koleksi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-line bg-bg/70 p-4 space-y-1">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted font-medium">
                Tier Saat Ini
              </span>
              <p className="font-display text-xl text-ink">
                {activeTierLabel}
              </p>
              <p className="text-[0.68rem] text-muted">
                {currentUser.memberSince
                  ? `Aktif sejak ${new Date(currentUser.memberSince).toLocaleDateString('id-ID', {
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : 'Keanggotaan otomatis'}
              </p>
            </div>

            <div className="border border-line bg-bg/70 p-4 space-y-1">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted font-medium">
                Akumulasi Belanja Tervalidasi
              </span>
              <p className="font-display text-xl text-ink">{formatRupiah(totalSpent)}</p>
              <p className="text-[0.68rem] text-muted">
                Dari {loyalty?.paidOrdersCount ?? 0} pesanan terbayar
              </p>
            </div>

            <div className="border border-line bg-bg/70 p-4 space-y-1">
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted font-medium">
                Status Collector VIP
              </span>
              <p className="font-display text-xl text-ink">
                {isVip ? 'Terbuka Penuh' : formatRupiah(remainingForVip)}
              </p>
              <p className="text-[0.68rem] text-muted">
                {isVip
                  ? 'Semua benefit VIP aktif di checkout'
                  : `Sisa belanja menuju batas ${formatRupiah(threshold)}`}
              </p>
            </div>
          </div>

          {/* Progress Bar toward Collector VIP */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">
                {isVip
                  ? `Anda telah mencapai status ${vipLabel} OMOO`
                  : `Progres menuju ${vipLabel} (${progressPercent}%)`}
              </span>
              <span className="text-muted">
                {formatRupiah(Math.min(totalSpent, threshold))} / {formatRupiah(threshold)}
              </span>
            </div>

            <div className="w-full h-2 bg-surface border border-line overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {!isVip && (
              <p className="text-[0.72rem] text-muted">
                Selesaikan transaksi tervalidasi senilai{' '}
                <strong className="text-ink">{formatRupiah(remainingForVip)}</strong> lagi untuk
                otomatis naik ke tier Collector VIP tanpa pengajuan manual.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-line bg-surface/25 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.14em] text-accent font-semibold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Otomatis & Tanpa Formulir</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink">
                Daftar Sekali, Tier Naik Otomatis Saat Berbelanja
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Setiap akun terverifikasi langsung aktif sebagai <strong className="text-ink">Member</strong>.
                Ketika total pesanan terbayar mencapai{' '}
                <strong className="text-ink">{formatRupiah(threshold)}</strong>, status Anda otomatis
                meningkat menjadi <strong className="text-ink">Collector VIP</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="/collection"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-ink text-bg hover:bg-ink/85 text-xs font-semibold uppercase tracking-[0.12em] transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-accent" />
                <span>Lihat Koleksi</span>
              </a>
              <a
                href="/account/tracker"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-line bg-bg hover:border-ink text-ink text-xs font-semibold uppercase tracking-[0.12em] transition-colors"
              >
                <span>Lacak Pesanan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="border-t border-line pt-4 text-xs text-muted">
            Sudah memiliki pesanan atau ingin mendaftar akun Member? Klik tombol{' '}
            <strong className="text-ink uppercase tracking-wider">Akun</strong> pada bilah navigasi di
            bagian atas halaman untuk masuk atau membuat akun dengan verifikasi email.
          </div>
        </div>
      )}

      {/* Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`border p-6 space-y-4 ${
            authenticated && !isVip ? 'border-ink bg-surface/30' : 'border-line bg-surface/15'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted font-semibold">
                Tier 01
              </span>
              <h3 className="font-display text-2xl text-ink font-normal mt-0.5">Member</h3>
            </div>
            <span className="px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.1em] border border-line bg-bg text-ink font-semibold">
              Gratis Setelah Daftar
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Aktif otomatis segera setelah Anda mendaftarkan akun OMOO dengan verifikasi email OTP.
          </p>
          <ul className="space-y-2.5 text-xs text-ink">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Riwayat transaksi & pelacakan resi pengiriman real-time</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Checkout cepat dengan detail penerima tersimpan otomatis</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Akumulasi belanja terhitung otomatis menuju Collector VIP</span>
            </li>
          </ul>
        </div>

        <div
          className={`border p-6 space-y-4 ${
            isVip ? 'border-accent bg-accent-fill/15' : 'border-line bg-surface/15'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <span className="text-[0.62rem] uppercase tracking-[0.14em] text-accent font-semibold">
                Tier 02
              </span>
              <h3 className="font-display text-2xl text-ink font-normal mt-0.5">Collector VIP</h3>
            </div>
            <span className="px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.1em] border border-accent bg-accent-fill/25 text-ink font-semibold">
              Belanja &ge; {formatRupiah(threshold)}
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Terbuka otomatis setelah total pesanan Anda yang tervalidasi mencapai{' '}
            {formatRupiah(threshold)}.
          </p>
          <ul className="space-y-2.5 text-xs text-ink">
            <li className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Gratis ongkos kirim ke seluruh Indonesia untuk setiap transaksi</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Bonus sampel vial 2 ml pilihan di setiap pemesanan botol 50 ml</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Prioritas reservasi saat batch terbaru dan edisi musiman dirilis</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Live Benefit Status Checklist when logged in */}
      {authenticated && benefits.length > 0 && (
        <div className="border border-line bg-surface/15 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-xl text-ink font-normal">
              Hak Istimewa Akun Anda
            </h3>
            <span className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">
              {benefits.filter((b) => b.unlocked).length} / {benefits.length} Aktif
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className={`p-3.5 border flex items-start gap-3 ${
                  benefit.unlocked
                    ? 'border-line bg-bg'
                    : 'border-line/60 bg-surface/30 opacity-70'
                }`}
              >
                {benefit.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-ink">{benefit.label}</p>
                  <p className="text-[0.7rem] text-muted leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
