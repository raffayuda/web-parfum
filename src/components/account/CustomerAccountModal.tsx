import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/react/Modal';
import { Button } from '../ui/react/Button';
import { Input } from '../ui/react/Input';
import { api, API_BASE } from '../../lib/api';
import { toast } from 'sonner';
import { User, Package, LogOut, Shield, Award } from 'lucide-react';

export interface CustomerAccountModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

/** Safely read a Fetch Response body once and parse JSON if possible. */
async function readJsonSafely(res: Response): Promise<{ data: any; rawText: string }> {
  const rawText = await res.text();
  try {
    return { data: rawText ? JSON.parse(rawText) : null, rawText };
  } catch {
    return { data: null, rawText };
  }
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
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    const cachedUser = localStorage.getItem('omoo_customer_user');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch {}
    }

    checkUser();

    const handleOpenAccount = () => {
      setIsOpen(true);
    };
    const handleAuthChanged = () => {
      const updated = localStorage.getItem('omoo_customer_user');
      if (updated) {
        try {
          setCurrentUser(JSON.parse(updated));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener('omoo:open-account-modal', handleOpenAccount);
    window.addEventListener('omoo:auth-changed', handleAuthChanged);
    return () => {
      window.removeEventListener('omoo:open-account-modal', handleOpenAccount);
      window.removeEventListener('omoo:auth-changed', handleAuthChanged);
    };
  }, []);

  const checkUser = async () => {
    try {
      const res = await api.getMe();
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(res.user));
        if (res.user.role === 'ADMIN') {
          localStorage.setItem('omoo_admin_session', 'active');
        }
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

      const { data, rawText } = await readJsonSafely(res);

      if (!res.ok) {
        throw new Error(data?.message || rawText || 'Email atau password tidak sesuai.');
      }

      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(data.user));
        if (data.user.role === 'ADMIN') {
          localStorage.setItem('omoo_admin_session', 'active');
        }
        window.dispatchEvent(new Event('omoo:auth-changed'));
        setFormSuccess(`Selamat datang kembali, ${data.user.name}!`);
        toast.success(`Selamat datang kembali, ${data.user.name}!`);
        setTimeout(() => handleClose(), 800);
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

      const { data, rawText } = await readJsonSafely(res);

      if (!res.ok) {
        throw new Error(data?.message || rawText || 'Gagal mendaftar. Email mungkin sudah digunakan.');
      }

      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('omoo:auth-changed'));
        setFormSuccess(`Akun berhasil dibuat! Selamat datang di OMOO, ${data.user.name}.`);
        toast.success(`Akun berhasil dibuat! Selamat datang di OMOO, ${data.user.name}.`);
        setTimeout(() => handleClose(), 800);
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
    localStorage.removeItem('omoo_admin_session');
    localStorage.removeItem('omoo_visual_edit_mode');
    setCurrentUser(null);
    setFormSuccess(null);
    setFormError(null);
    window.dispatchEvent(new Event('omoo:auth-changed'));
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickOrderNumber.trim()) {
      window.location.href = `/account/tracker?order=${encodeURIComponent(quickOrderNumber.trim())}`;
    }
  };

  return (
    <>
      {forceOpen === undefined && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-[0.7rem] font-medium uppercase leading-none tracking-[0.1em] text-muted transition-colors duration-300 ease-luxe hover:text-ink flex items-center gap-1.5 cursor-pointer"
          aria-label="Akun Saya"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {currentUser ? currentUser.name.split(' ')[0] : 'Akun'}
          </span>
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={currentUser ? 'Akun Saya' : 'Akun OMOO'}
        subtitle={
          currentUser
            ? `Masuk sebagai ${currentUser.email}`
            : 'Masuk, daftar akun, atau lacak status pesanan Anda.'
        }
        maxWidth="md"
      >
        {currentUser ? (
          <div className="space-y-6">
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
                    Member
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="/account/tracker"
                className="w-full flex items-center justify-between p-3.5 border border-line bg-bg hover:border-ink transition-colors text-xs font-semibold uppercase tracking-[0.08em] text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-accent" />
                  <span>Lacak Pesanan Saya</span>
                </div>
                <span>&rarr;</span>
              </a>

              <a
                href="/account/member"
                className="w-full flex items-center justify-between p-3.5 border border-line bg-bg hover:border-ink transition-colors text-xs font-semibold uppercase tracking-[0.08em] text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-accent" />
                  <span>Membership Privé</span>
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
                    <span>Dashboard Admin OMOO</span>
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
          <div className="space-y-6">
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

            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
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
              </form>
            )}

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
                  placeholder="nama@email.com"
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

            {activeTab === 'quick-track' && (
              <form onSubmit={handleQuickTrack} className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Pesan lewat WhatsApp tanpa akun? Masukkan nomor pesanan Anda untuk melihat status pengemasan dan pengiriman.
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
