import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/react/Modal';
import { Button } from '../ui/react/Button';
import { Input } from '../ui/react/Input';
import { api, API_BASE } from '../../lib/api';
import { toast } from 'sonner';
import { User, LogIn, UserPlus, Package, LogOut, Shield, Award, CheckCircle2 } from 'lucide-react';

export interface CustomerAccountModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  forceOpen,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(forceOpen ?? false);

  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'quick-track'>('login');

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quickOrderNumber, setQuickOrderNumber] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check login state on mount & listen for global trigger
  useEffect(() => {
    // 1. Immediately hydrate from localStorage to prevent flash of unauthenticated state
    const cachedUser = localStorage.getItem('omoo_customer_user');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch {}
    }

    // 2. Concurrently check server session
    checkUser();

    const handleOpenAccount = () => {
      setIsOpen(true);
    };
    window.addEventListener('omoo:open-account-modal', handleOpenAccount);
    return () => {
      window.removeEventListener('omoo:open-account-modal', handleOpenAccount);
    };
  }, []);

  const checkUser = async () => {
    try {
      const res = await api.getMe();
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(res.user));
      } else {
        // If server explicitly returns no session, only keep if cached
      }
    } catch {
      // Keep cached user if offline
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const rawText = await res.text();
        throw new Error(rawText || 'Format respon server tidak valid.');
      }

      if (!res.ok) {
        throw new Error(data?.message || 'Email atau password tidak sesuai.');
      }

      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(data.user));
        if (data.user.role === 'ADMIN') {
          localStorage.setItem('omoo_admin_session', 'active');
        }
        setFormSuccess(`Selamat datang kembali, ${data.user.name}!`);
        toast.success(`Selamat datang kembali, ${data.user.name}!`);
        setTimeout(() => handleClose(), 900);
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
      toast.error(err.message || 'Gagal masuk. Periksa email & password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const rawText = await res.text();
        throw new Error(rawText || 'Gagal memproses pendaftaran akun.');
      }

      if (!res.ok) {
        throw new Error(data?.message || 'Gagal mendaftar. Email mungkin sudah digunakan.');
      }

      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(data.user));
        setFormSuccess(`Akun berhasil dibuat! Selamat datang di OMOO, ${data.user.name}.`);
        toast.success(`Akun berhasil dibuat! Selamat datang di OMOO, ${data.user.name}.`);
        setTimeout(() => handleClose(), 900);
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal mendaftar akun.');
      toast.error(err.message || 'Gagal mendaftar akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}

    localStorage.removeItem('omoo_customer_user');
    localStorage.removeItem('omoo_customer_demo');
    localStorage.removeItem('omoo_admin_session');
    setCurrentUser(null);
    setFormSuccess(null);
    setFormError(null);
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickOrderNumber.trim()) {
      window.location.href = `/account/tracker?order=${encodeURIComponent(quickOrderNumber.trim())}`;
    }
  };

  return (
    <>
      {/* Discreet Trigger Button in Header Action Bar (only if not forced) */}
      {forceOpen === undefined && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-[0.7rem] font-medium uppercase leading-none tracking-[0.1em] text-muted transition-colors duration-300 ease-luxe hover:text-ink flex items-center gap-1.5 cursor-pointer"
          aria-label="Akun Saya"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {currentUser ? currentUser.name.split(' ')[0] : 'Account'}
          </span>
        </button>
      )}

      {/* Account Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={currentUser ? 'Akun Saya' : 'Atelier OMOO'}
        subtitle={
          currentUser
            ? `Masuk sebagai ${currentUser.email}`
            : 'Masuk, daftarkan akun, atau lacak pesanan wewangian Anda.'
        }
        maxWidth="md"
      >
        {currentUser ? (
          /* LOGGED IN VIEW */
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="border border-line bg-surface/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-2xl text-ink font-normal">{currentUser.name}</h4>
                  <p className="text-xs text-muted mt-0.5">{currentUser.email}</p>
                </div>
                {currentUser.memberStatus === 'ACTIVE' ? (
                  <span className="px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.1em] font-semibold bg-accent-fill/25 text-ink border border-accent">
                    Cercle Privé
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.1em] font-medium bg-surface text-muted border border-line">
                    Customer
                  </span>
                )}
              </div>
            </div>

            {/* User Action Links */}
            <div className="space-y-2">
              <a
                href="/account/tracker"
                className="w-full flex items-center justify-between p-3.5 border border-line bg-bg hover:border-ink transition-colors text-xs font-semibold uppercase tracking-[0.08em] text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-accent" />
                  <span>Lacak Pesanan Saya (Tracker)</span>
                </div>
                <span>&rarr;</span>
              </a>

              <a
                href="/account/member"
                className="w-full flex items-center justify-between p-3.5 border border-line bg-bg hover:border-ink transition-colors text-xs font-semibold uppercase tracking-[0.08em] text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-accent" />
                  <span>Membership Cercle Privé</span>
                </div>
                <span>&rarr;</span>
              </a>

              {currentUser.role === 'ADMIN' && (
                <a
                  href="/admin"
                  className="w-full flex items-center justify-between p-3.5 border border-accent bg-accent/10 hover:bg-accent/20 transition-colors text-xs font-semibold uppercase tracking-[0.08em] text-ink"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-accent" />
                    <span>Portal Dashboard Admin Atelier</span>
                  </div>
                  <span>&rarr;</span>
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <Button
                variant="outline"
                size="sm"
                icon={<LogOut className="w-3.5 h-3.5" />}
                onClick={handleLogout}
              >
                Keluar (Logout)
              </Button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN: TABS (Login, Register, Quick Track) */
          <div className="space-y-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-line">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs uppercase tracking-[0.08em] font-medium border-b-2 transition-colors ${
                  activeTab === 'login'
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs uppercase tracking-[0.08em] font-medium border-b-2 transition-colors ${
                  activeTab === 'register'
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Daftar Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('quick-track');
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs uppercase tracking-[0.08em] font-medium border-b-2 transition-colors ${
                  activeTab === 'quick-track'
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Lacak Cepat
              </button>
            </div>

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@omoo.studio"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {formError && <p className="text-xs text-red-600">{formError}</p>}
                {formSuccess && (
                  <p className="text-xs text-emerald-700 font-medium">{formSuccess}</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                >
                  Masuk ke Akun
                </Button>

                <div className="pt-2 text-center">
                  <p className="text-[0.68rem] text-muted">
                    Akun Demo: <code>customer@omoo.studio</code> / <code>customer123</code>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                />
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
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                />

                {formError && <p className="text-xs text-red-600">{formError}</p>}
                {formSuccess && (
                  <p className="text-xs text-emerald-700 font-medium">{formSuccess}</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                >
                  Buat Akun Sekarang
                </Button>
              </form>
            )}

            {/* TAB 3: QUICK ORDER TRACKER */}
            {activeTab === 'quick-track' && (
              <form onSubmit={handleQuickTrack} className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Pesan lewat WhatsApp dan tidak punya akun? Masukkan nomor pesanan Anda untuk langsung melihat status peracikan dan pengiriman.
                </p>
                <Input
                  label="Nomor Pesanan"
                  value={quickOrderNumber}
                  onChange={(e) => setQuickOrderNumber(e.target.value)}
                  placeholder="OM-20261122-0042"
                  className="font-mono uppercase"
                  required
                />

                <Button type="submit" variant="primary" className="w-full">
                  Lihat Tracker Pesanan &rarr;
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
