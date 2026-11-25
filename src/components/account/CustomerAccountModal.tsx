import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/react/Modal';
import { Button } from '../ui/react/Button';
import { Input } from '../ui/react/Input';
import { api, API_BASE } from '../../lib/api';
import { toast } from 'sonner';
import { User, Package, LogOut, Shield, Award, ArrowLeft, MailCheck } from 'lucide-react';
import { ForgotPasswordPanel } from '../auth/ForgotPasswordPanel';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quickOrderNumber, setQuickOrderNumber] = useState('');

  // Registration OTP states
  const [registerStep, setRegisterStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cooldown countdown for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
    } catch {}
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

  const handleSendRegisterOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim() || !phone.trim() || !email.trim() || password.length < 8) {
      setFormError('Lengkapi nama, WhatsApp, email, dan password minimal 8 karakter.');
      return;
    }

    if (registerStep === 'form' && password !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok dengan password Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        }),
      });

      const { data, rawText } = await readJsonSafely(res);

      if (!res.ok) {
        throw new Error(data?.message || rawText || 'Gagal mengirim kode OTP.');
      }

      setRegisterStep('otp');
      setResendCooldown(data?.cooldownSeconds || 45);
      setFormSuccess(data?.message || `Kode OTP telah dikirim ke ${email.trim()}.`);
      toast.success('Kode OTP dikirim! Silakan cek kotak masuk atau folder spam email Anda.');
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengirim kode OTP.');
      toast.error(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          otp: otpCode.trim(),
        }),
      });

      const { data, rawText } = await readJsonSafely(res);

      if (!res.ok) {
        throw new Error(data?.message || rawText || 'Verifikasi kode OTP gagal.');
      }

      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('omoo_customer_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('omoo:auth-changed'));
        setRegisterStep('form');
        setOtpCode('');
        setFormSuccess(`Akun terverifikasi! Selamat datang di OMOO, ${data.user.name}.`);
        toast.success(`Akun berhasil dibuat! Selamat datang di OMOO, ${data.user.name}.`);
        setTimeout(() => handleClose(), 800);
      }
    } catch (err: any) {
      setFormError(err.message || 'Kode OTP tidak valid.');
      toast.error(err.message || 'Kode OTP tidak valid.');
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
          aria-label="My Account"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {currentUser ? currentUser.name.split(' ')[0] : 'Account'}
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
        maxWidth="lg"
      >
        {!currentUser && (
          <div className="flex justify-center pb-4 mb-4 border-b border-line/60">
            <img
              src="/images/omoo-full-black.svg"
              alt="O.M.OO"
              className="h-12 w-auto object-contain block dark:hidden"
            />
            <img
              src="/images/omoo-full-gold.svg"
              alt="O.M.OO"
              className="h-12 w-auto object-contain hidden dark:block"
            />
          </div>
        )}
        {currentUser ? (
          <div className="space-y-6">
            <div className="border border-line bg-surface/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-2xl text-ink font-normal">{currentUser.name}</h4>
                  <p className="text-xs text-muted mt-0.5">{currentUser.email}</p>
                </div>
                {currentUser.memberTier === 'Collector' ? (
                  <span className="px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.1em] font-semibold bg-accent-fill/25 text-ink border border-accent">
                    Collector VIP
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
                href="/account/orders"
                className="w-full flex items-center justify-between p-3.5 border border-line bg-bg hover:border-ink transition-colors text-xs font-semibold uppercase tracking-[0.08em] text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-accent" />
                  <span>My Orders</span>
                </div>
                <span>&rarr;</span>
              </a>

              <a
                href="/member"
                className="w-full flex items-center justify-between p-3.5 border border-line bg-bg hover:border-ink transition-colors text-xs font-semibold uppercase tracking-[0.08em] text-ink"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-accent" />
                  <span>Loyalty Membership</span>
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
                  setIsForgotPassword(false);
                  setFormError(null);
                  setFormSuccess(null);
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
                  setFormSuccess(null);
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
                  setFormSuccess(null);
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

            {activeTab === 'login' && isForgotPassword && (
              <ForgotPasswordPanel
                initialEmail={email}
                onCancel={() => {
                  setIsForgotPassword(false);
                  setFormError(null);
                }}
                onSuccess={(resetEmail) => {
                  setEmail(resetEmail);
                  setPassword('');
                  setIsForgotPassword(false);
                  setFormError(null);
                  setFormSuccess('Kata sandi berhasil direset. Silakan masuk dengan sandi baru.');
                }}
              />
            )}

            {activeTab === 'login' && !isForgotPassword && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                />
                <div className="space-y-1">
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setFormError(null);
                        setFormSuccess(null);
                      }}
                      className="text-[0.68rem] text-accent hover:text-ink transition-colors cursor-pointer"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                </div>

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

            {activeTab === 'register' && registerStep === 'form' && (
              <form onSubmit={handleSendRegisterOtp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    required
                  />
                  <Input
                    label="Konfirmasi Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password Anda"
                    minLength={8}
                    required
                  />
                </div>

                {formError && <p className="text-xs text-red-600">{formError}</p>}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                >
                  Kirim Kode OTP ke Email
                </Button>
              </form>
            )}

            {activeTab === 'register' && registerStep === 'otp' && (
              <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
                <div className="border border-line bg-surface/30 p-4 flex items-start gap-3">
                  <MailCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-ink">Verifikasi Email Anda</p>
                    <p className="text-muted leading-relaxed">
                      Kami telah mengirimkan kode OTP 6 digit ke{' '}
                      <span className="text-ink font-medium">{email.trim()}</span>.
                    </p>
                  </div>
                </div>

                <Input
                  label="Kode OTP (6 Digit)"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="font-mono text-center text-lg tracking-[0.4em]"
                  required
                />

                {formError && <p className="text-xs text-red-600">{formError}</p>}
                {formSuccess && (
                  <p className="text-xs text-emerald-700 font-medium">{formSuccess}</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={otpCode.length < 6}
                >
                  Verifikasi &amp; Buat Akun
                </Button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('form');
                      setOtpCode('');
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ubah Data</span>
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSubmitting}
                    onClick={() => handleSendRegisterOtp()}
                    className="text-accent hover:text-ink disabled:text-muted/60 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
                  >
                    {resendCooldown > 0
                      ? `Kirim ulang (${resendCooldown}d)`
                      : 'Kirim Ulang Kode OTP'}
                  </button>
                </div>
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
                  Track Order &rarr;
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
