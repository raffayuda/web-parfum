import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { api, API_BASE } from '../lib/api';
import { OverviewTab } from './components/OverviewTab';
import { CatalogTab } from './components/CatalogTab';
import { OrdersTab } from './components/OrdersTab';
import { CustomersTab } from './components/CustomersTab';
import { ManualOrderTab } from './components/ManualOrderTab';
import { MembersTab } from './components/MembersTab';
import { CertificatesTab } from './components/CertificatesTab';
import { SettingsTab } from './components/SettingsTab';
import { FaqTab } from './components/FaqTab';
import { GalleryTab } from './components/GalleryTab';
import { Toaster } from 'sonner';
import { Button } from '../components/ui/react/Button';
import { Input } from '../components/ui/react/Input';
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
} from 'lucide-react';

const AdminDashboardInner: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        } else if (res && res.user && res.user.role !== 'ADMIN') {
          setIsAuthenticated(false);
          localStorage.removeItem('omoo_admin_session');
        }
      } catch {
        // Fallback to cached admin session if offline
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && tabParam !== 'builder') {
        setActiveTab(tabParam);
      }

      const handlePopState = () => {
        const p = new URLSearchParams(window.location.search);
        const t = p.get('tab');
        if (t && t !== 'builder') setActiveTab(t);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.pushState(null, '', url.toString());
    }
  };

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
  ];

  const currentTabLabel =
    navigationGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ||
    'Dashboard';

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

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Administrator"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="nama@email.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

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
            <div className="flex items-center gap-2.5">
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
            </div>
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
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabChange(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.08em] transition-all text-left cursor-pointer border ${
                        isActive
                          ? 'bg-ink text-bg border-ink shadow-sm'
                          : 'bg-transparent text-muted border-transparent hover:bg-surface hover:text-ink'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                    </button>
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
              className="p-1.5 text-muted hover:text-red-700 transition-colors"
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

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted uppercase tracking-[0.1em]">Admin OMOO</span>
              <span className="text-line">/</span>
              <span className="text-ink font-semibold uppercase tracking-[0.1em]">
                {currentTabLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
          {activeTab === 'overview' && <OverviewTab onNavigate={handleTabChange} />}
          {activeTab === 'catalog' && <CatalogTab />}
          {activeTab === 'gallery' && <GalleryTab />}
          {activeTab === 'faq' && <FaqTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'certificates' && <CertificatesTab />}
          {activeTab === 'manual-order' && <ManualOrderTab />}
        </main>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <AdminDashboardInner />
    </QueryClientProvider>
  );
};
