import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  ShoppingBag,
  Users,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Lock,
  Sliders,
  HelpCircle,
  Camera,
  UserCog,
  Database,
  Bell,
  BellRing,
  BellOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { ForgotPasswordPanel } from '../../components/auth/ForgotPasswordPanel';
import { api, API_BASE } from '../../lib/api';

interface AdminLayoutProps {
  activeTab?: string;
  breadcrumb?: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab = 'orders',
  breadcrumb,
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [awaitingCount, setAwaitingCount] = useState<number>(0);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstPollRef = useRef<boolean>(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const cachedUser = localStorage.getItem('omoo_customer_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed?.role === 'ADMIN') {
            setAdminUser(parsed);
            setIsAuthenticated(true);
          }
        }
      } catch {}

      try {
        const res = await api.getMe();
        if (res?.success && res.user?.role === 'ADMIN') {
          setAdminUser(res.user);
          setIsAuthenticated(true);
          localStorage.setItem('omoo_admin_session', 'active');
          localStorage.setItem('omoo_customer_user', JSON.stringify(res.user));
        }
      } catch {} finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();
  }, []);

  // Sync browser notification permission & load previously notified order IDs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
    }

    try {
      const saved = localStorage.getItem('omoo_notified_payment_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          seenOrderIdsRef.current = new Set(parsed);
        }
      }
    } catch {}
  }, []);

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {}
  };

  const triggerPaymentNotification = (order: any) => {
    const amountText = `Rp ${Number(order.totalAmount || 0).toLocaleString('id-ID')}`;
    const title = `Bukti Pembayaran Baru — #${order.orderNumber}`;
    const body = `${order.customerName || 'Pelanggan'} mengirim bukti bayar (${amountText}). Klik untuk validasi.`;

    playNotificationChime();
    toast.info(title, {
      description: body,
      duration: 8000,
      action: {
        label: 'Lihat Pesanan',
        onClick: () => {
          window.location.href = `/admin/orders/${order.id}`;
        },
      },
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: `omoo-payment-${order.id}`,
        });
        notif.onclick = () => {
          window.focus();
          window.location.href = `/admin/orders/${order.id}`;
          notif.close();
        };
      } catch {}
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Browser Anda tidak mendukung notifikasi desktop.');
      return;
    }
    if (Notification.permission === 'denied') {
      toast.error('Izin notifikasi diblokir browser. Aktifkan di pengaturan situs (ikon gembok di address bar).');
      return;
    }
    if (Notification.permission === 'granted') {
      if (awaitingCount > 0) {
        window.location.href = '/admin?tab=orders';
      } else {
        toast.success('Notifikasi browser sudah aktif untuk bukti pembayaran baru.');
      }
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        toast.success('Notifikasi browser diaktifkan!');
        new Notification('Notifikasi Admin OMOO Aktif', {
          body: 'Anda akan mendapat pemberitahuan otomatis saat pembeli mengunggah bukti pembayaran.',
          icon: '/favicon.svg',
        });
      } else {
        toast.error('Izin notifikasi tidak diberikan.');
      }
    } catch {
      toast.error('Gagal meminta izin notifikasi browser.');
    }
  };

  // Poll every 15s for newly submitted payment proofs (AWAITING_VALIDATION)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const checkIncomingPayments = async () => {
      try {
        const res = await api.getOrders({ status: 'AWAITING_VALIDATION' });
        if (cancelled || !res?.success || !Array.isArray(res.data)) return;

        const awaitingOrders = res.data;
        setAwaitingCount(awaitingOrders.length);

        const newOnes = awaitingOrders.filter((o: any) => !seenOrderIdsRef.current.has(o.id));
        if (newOnes.length > 0) {
          for (const o of newOnes) {
            seenOrderIdsRef.current.add(o.id);
            // Notify on new arrivals (or on first poll if it's genuinely unseen in localStorage)
            if (!isFirstPollRef.current || awaitingOrders.length > 0) {
              triggerPaymentNotification(o);
            }
          }
          try {
            const arr = Array.from(seenOrderIdsRef.current).slice(-100);
            localStorage.setItem('omoo_notified_payment_orders', JSON.stringify(arr));
          } catch {}
        }
        isFirstPollRef.current = false;
      } catch {}
    };

    checkIncomingPayments();
    const intervalId = setInterval(checkIncomingPayments, 15000);
    // Keep admin session alive (triggers BetterAuth sliding updateAge) and verify session validity every 15 minutes
    const sessionKeepAliveId = setInterval(async () => {
      try {
        const res = await api.getMe();
        if (!res?.success || res.user?.role !== 'ADMIN') {
          setIsAuthenticated(false);
          setAdminUser(null);
          localStorage.removeItem('omoo_admin_session');
          localStorage.removeItem('omoo_customer_user');
        }
      } catch {}
    }, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      clearInterval(sessionKeepAliveId);
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {}

      if (!res.ok) {
        throw new Error(data?.message || rawText || 'Email atau password administrator tidak sesuai.');
      }

      if (data?.user?.role !== 'ADMIN') {
        throw new Error('Akun ini tidak memiliki akses administrator.');
      }

      localStorage.setItem('omoo_admin_session', 'active');
      localStorage.setItem('omoo_customer_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('omoo:auth-changed'));
      setAdminUser(data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    setIsAuthenticated(false);
    setAdminUser(null);
    localStorage.removeItem('omoo_admin_session');
    localStorage.removeItem('omoo_customer_user');
    window.dispatchEvent(new Event('omoo:auth-changed'));
    window.location.href = '/admin';
  };

  const navigationGroups = [
    {
      group: 'IKHTISAR',
      items: [
        { id: 'overview', label: 'Ringkasan / Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'PRODUK & TOKO',
      items: [
        { id: 'catalog', label: 'Katalog Parfum & Stok', icon: Sparkles },
        { id: 'gallery', label: 'Galeri & Dokumentasi', icon: Camera },
        { id: 'faq', label: 'Kelola FAQ (Tanya Jawab)', icon: HelpCircle },
        { id: 'settings', label: 'Pengaturan Toko & Kontak', icon: Sliders },
      ],
    },
    {
      group: 'TRANSAKSI & CUSTOMER',
      items: [
        { id: 'orders', label: 'Validasi Pesanan & Bukti', icon: ShoppingBag },
        { id: 'customers', label: 'Data User & Customer', icon: Users },
        { id: 'members', label: 'Member & Loyalty', icon: ShieldCheck },
      ],
    },
    {
      group: 'LEGALITAS & TRUST',
      items: [
        { id: 'certificates', label: 'Cetak Sertifikat Halal & BPOM', icon: ShieldCheck },
      ],
    },
    {
      group: 'AKUN ADMIN',
      items: [
        { id: 'profile', label: 'Profil & Kata Sandi', icon: UserCog },
        { id: 'backups', label: 'Backup Database', icon: Database },
      ],
    },
  ];

  const currentTabItem = navigationGroups.flatMap((g) => g.items).find((i) => i.id === activeTab);
  const currentTabLabel = currentTabItem?.label || 'Manajemen Pesanan';

  if (isCheckingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted animate-pulse">
          Memeriksa sesi admin...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md border border-line bg-surface/30 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <img
              src="/images/omoo-full-black.svg"
              alt="O.M.OO"
              className="h-16 w-auto object-contain mx-auto block dark:hidden"
            />
            <img
              src="/images/omoo-full-gold.svg"
              alt="O.M.OO"
              className="h-16 w-auto object-contain mx-auto hidden dark:block"
            />
            <p className="text-[0.68rem] uppercase tracking-[0.15em] text-muted font-medium">
              Portal Manajemen Administrator
            </p>
          </div>

          {isForgotPassword ? (
            <ForgotPasswordPanel
              initialEmail={loginEmail}
              onCancel={() => setIsForgotPassword(false)}
              onSuccess={(resetEmail) => {
                setLoginEmail(resetEmail);
                setLoginPassword('');
                setLoginError('');
                setIsForgotPassword(false);
              }}
            />
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email Administrator"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setLoginError('');
                    }}
                    className="text-[0.68rem] text-accent hover:text-ink transition-colors cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-red-600 tracking-wide">{loginError}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoggingIn}
              >
                Masuk ke Dashboard
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-line text-center">
            <a
              href="/"
              className="text-xs text-muted hover:text-ink transition-colors uppercase tracking-[0.08em]"
            >
              &larr; Kembali ke Website Utama
            </a>
          </div>
        </div>
      </div>
    );
  }

  const adminName = adminUser?.name || 'Administrator';
  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('') || 'AD';

  return (
    <div className="min-h-screen bg-bg text-ink flex">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-surface/80 border-r border-line flex flex-col justify-between z-50 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-16 px-6 border-b border-line flex items-center justify-between">
            <a href="/admin?tab=overview" className="flex items-center gap-2.5">
              <img
                src="/images/omoo-wordmark-black.svg"
                alt="O.M.OO"
                className="h-4 w-auto object-contain block dark:hidden"
              />
              <img
                src="/images/omoo-wordmark-gold.svg"
                alt="O.M.OO"
                className="h-4 w-auto object-contain hidden dark:block"
              />
              <img
                src="/images/omoo-logo-black.svg"
                alt=""
                aria-hidden="true"
                className="h-5 w-auto object-contain block dark:hidden"
              />
              <img
                src="/images/omoo-logo-gold.svg"
                alt=""
                aria-hidden="true"
                className="h-5 w-auto object-contain hidden dark:block"
              />
              <span className="px-2 py-0.5 text-[0.58rem] uppercase font-semibold bg-ink text-bg tracking-[0.1em]">
                ADMIN
              </span>
            </a>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-muted hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navigationGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <span className="text-[0.6rem] uppercase tracking-[0.16em] font-semibold text-muted/70 px-3 block">
                  {group.group}
                </span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`/admin?tab=${item.id}`}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.08em] transition-all text-left cursor-pointer border ${
                        isActive
                          ? 'bg-ink text-bg border-ink shadow-sm'
                          : 'bg-transparent text-muted border-transparent hover:bg-surface hover:text-ink'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.id === 'orders' && awaitingCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[0.6rem] font-bold rounded-full bg-amber-500 text-black leading-none">
                          {awaitingCount}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-line bg-surface/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full border border-line bg-bg flex items-center justify-center font-display font-medium text-xs text-ink shrink-0">
                {adminInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{adminName}</p>
                <p className="text-[0.62rem] text-accent tracking-wide uppercase">Store Manager</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-muted hover:text-red-700 transition-colors cursor-pointer"
              title="Keluar (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-line bg-bg/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-muted hover:text-ink border border-line"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <a href="/admin" className="text-muted hover:text-ink uppercase tracking-[0.1em] transition-colors">
                Admin OMOO
              </a>
              <span className="text-line">/</span>
              <a
                href={`/admin?tab=${activeTab}`}
                className="text-muted hover:text-ink uppercase tracking-[0.1em] transition-colors"
              >
                {currentTabLabel}
              </a>
              {breadcrumb && (
                <>
                  <span className="text-line">/</span>
                  <span className="text-ink font-semibold uppercase tracking-[0.1em]">
                    {breadcrumb}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {notifPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-medium transition-colors cursor-pointer ${
                  notifPermission === 'granted'
                    ? 'border-line bg-surface/40 hover:border-accent text-ink'
                    : notifPermission === 'denied'
                    ? 'border-line bg-surface/20 text-muted'
                    : 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}
                title={
                  notifPermission === 'granted'
                    ? 'Notifikasi browser aktif untuk bukti pembayaran baru'
                    : notifPermission === 'denied'
                    ? 'Notifikasi diblokir browser'
                    : 'Klik untuk mengaktifkan notifikasi browser'
                }
              >
                {notifPermission === 'granted' ? (
                  <BellRing className="w-3.5 h-3.5 text-emerald-500" />
                ) : notifPermission === 'denied' ? (
                  <BellOff className="w-3.5 h-3.5 text-muted" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                )}
                <span className="hidden md:inline">
                  {notifPermission === 'granted'
                    ? 'Notif Aktif'
                    : notifPermission === 'denied'
                    ? 'Notif Diblokir'
                    : 'Aktifkan Notif'}
                </span>
                {awaitingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[0.6rem] font-bold rounded-full bg-amber-500 text-black leading-none">
                    {awaitingCount}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Toko Online</span>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line bg-surface/30 hover:bg-surface text-ink text-xs uppercase tracking-[0.08em] font-medium transition-colors"
            >
              <span>Lihat Web Live</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted" />
            </a>
          </div>
        </header>

        <main className="p-4 sm:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
