import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Button } from '../ui/react/Button';
import { Input, Textarea } from '../ui/react/Input';
import { Badge } from '../ui/react/Badge';
import { Award, CheckCircle, Sparkles, ShieldCheck, Clock, User, ArrowRight } from 'lucide-react';

const MemberPortalInner: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Initial hydrate from localStorage
    const cached = localStorage.getItem('omoo_customer_user');
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setCurrentUser(u);
        setFullName(u.name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
      } catch {}
    }

    // 2. Fetch fresh user session from database
    api.getMe().then((res) => {
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(res.user));
        setFullName(res.user.name || '');
        setEmail(res.user.email || '');
        setPhone(res.user.phone || '');
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.applyMember({
        userId: currentUser?.id,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        reason: reason.trim(),
      });

      if (res && res.success) {
        setIsSubmitted(true);
        // Update user state to PENDING in local cache
        const updated = { ...currentUser, memberStatus: 'PENDING' };
        setCurrentUser(updated);
        localStorage.setItem('omoo_customer_user', JSON.stringify(updated));
        toast.success('Pengajuan Cercle Privé berhasil dikirim!');
      } else {
        throw new Error(res?.message || 'Gagal mengajukan keanggotaan.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengajukan keanggotaan.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMemberActive = currentUser?.memberStatus === 'ACTIVE';
  const isMemberPending = currentUser?.memberStatus === 'PENDING' || isSubmitted;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Introduction Card */}
      <div className="border border-line bg-surface/20 p-8 text-center space-y-3">
        <Award className="w-10 h-10 text-accent mx-auto" />
        <span className="text-[0.62rem] uppercase font-semibold tracking-[0.16em] text-accent">
          Privilege Program
        </span>
        <h3 className="font-display text-3xl font-light text-ink">
          OMOO Cercle Privé
        </h3>
        <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
          Program keanggotaan eksklusif OMOO. Anggota terdaftar mendapatkan akses awal ke rilisan edisi terbatas, undangan sesi tester privat di Jakarta, dan pengiriman prioritas.
        </p>
      </div>

      {/* CASE 1: ACTIVE MEMBER PASS */}
      {isMemberActive ? (
        <div className="border-2 border-accent bg-surface/40 p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-semibold block">
                Official Membership Pass
              </span>
              <h4 className="font-display text-3xl font-normal text-ink mt-0.5">
                {currentUser?.memberTier || 'Cercle Privé Gold'}
              </h4>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-[0.1em]">
              Status: Aktif
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[0.65rem] uppercase text-muted tracking-wider block">Nama Anggota</span>
              <span className="font-medium text-ink text-sm">{currentUser?.name}</span>
            </div>
            <div>
              <span className="text-[0.65rem] uppercase text-muted tracking-wider block">ID Keanggotaan</span>
              <span className="font-mono text-ink text-xs">{currentUser?.id?.slice(0, 14)}</span>
            </div>
            <div>
              <span className="text-[0.65rem] uppercase text-muted tracking-wider block">Email Terdaftar</span>
              <span className="font-mono text-ink">{currentUser?.email}</span>
            </div>
            <div>
              <span className="text-[0.65rem] uppercase text-muted tracking-wider block">WhatsApp Concierge</span>
              <span className="font-mono text-ink">{currentUser?.phone || '+62 812-0000-0000'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-line space-y-2">
            <span className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold text-accent block">
              Hak Istimewa Anggota Anda:
            </span>
            <ul className="text-xs text-muted space-y-1.5 leading-relaxed">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Akses reservasi pertama untuk setiap peluncuran formula baru.</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Undangan sesi privat mencoba aroma terbaru di studio Jakarta Selatan.</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Bebas biaya kirim pengiriman kilat (Express Overnight) ke seluruh Indonesia.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href="/collection"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-accent hover:text-ink transition-colors"
            >
              <span>Jelajahi Koleksi Khusus Member</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : isMemberPending ? (
        /* CASE 2: PENDING REVIEW */
        <div className="border border-line bg-surface/30 p-8 text-center space-y-4">
          <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
          <h4 className="font-display text-2xl text-ink font-normal">
            Permohonan Keanggotaan Sedang Ditinjau
          </h4>
          <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold uppercase tracking-[0.1em]">
            Status: Menunggu Persetujuan
          </span>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
            Tim kami sedang memverifikasi data pendaftaran Anda ({email || currentUser?.email}).
            Setelah disetujui oleh admin, status keanggotaan Cercle Privé Anda akan aktif secara otomatis.
          </p>
        </div>
      ) : (
        /* CASE 3: APPLICATION FORM */
        <div className="border border-line bg-surface/30 p-6 sm:p-8">
          <h4 className="font-display text-xl text-ink mb-2">
            Ajukan Keanggotaan Cercle Privé
          </h4>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            {currentUser
              ? `Anda sedang masuk sebagai ${currentUser.email}. Silakan lengkapi formulir di bawah ini.`
              : 'Silakan isi formulir di bawah ini untuk mengajukan permohonan keanggotaan OMOO.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama sesuai identitas"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@anda.com"
                required
              />
            </div>

            <Textarea
              label="Profil Aroma / Alasan Bergabung"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ceritakan profil wewangian yang biasa Anda kenakan atau preferensi aroma Anda..."
              rows={3}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Kirimkan Permohonan Keanggotaan
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export const MemberPortal: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemberPortalInner />
    </QueryClientProvider>
  );
};
