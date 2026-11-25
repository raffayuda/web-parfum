import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { api, API_BASE } from '../../lib/api';
import { CustomerAccountModal } from './CustomerAccountModal';
import { toast } from 'sonner';
import {
  User,
  LayoutDashboard,
  LogOut,
  Package,
  Award,
  ChevronDown,
  Edit3,
} from 'lucide-react';

export const AccountDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditActive, setIsEditActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const checkUserSession = () => {
    const cachedUser = localStorage.getItem('omoo_customer_user');
    const editActive = localStorage.getItem('omoo_visual_edit_mode') === 'true';
    setIsEditActive(editActive);

    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setCurrentUser(u);
        setIsAdmin(u.role === 'ADMIN');
      } catch {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    } else {
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };

  const handleToggleEditMode = () => {
    setIsOpen(false);
    const active = localStorage.getItem('omoo_visual_edit_mode') === 'true';
    if (active) {
      localStorage.removeItem('omoo_visual_edit_mode');
      setIsEditActive(false);
      window.dispatchEvent(new Event('omoo:toggle-edit-mode'));
      toast.info('Mode editor visual dinonaktifkan.');
    } else {
      localStorage.setItem('omoo_visual_edit_mode', 'true');
      setIsEditActive(true);
      window.dispatchEvent(new Event('omoo:toggle-edit-mode'));
      toast.success('Mode editor visual aktif! Sorot teks atau foto untuk mengubah.');
    }
  };

  useEffect(() => {
    checkUserSession();

    // Verify with server in background
    api
      .getMe()
      .then((res) => {
        if (res?.success && res.user) {
          setCurrentUser(res.user);
          setIsAdmin(res.user.role === 'ADMIN');
          localStorage.setItem('omoo_customer_user', JSON.stringify(res.user));
          if (res.user.role === 'ADMIN') {
            localStorage.setItem('omoo_admin_session', 'active');
          }
        } else if (res && res.user === null) {
          localStorage.removeItem('omoo_customer_user');
          localStorage.removeItem('omoo_admin_session');
          setCurrentUser(null);
          setIsAdmin(false);
        }
      })
      .catch(() => {});

    const handleStorageChange = () => checkUserSession();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('omoo:auth-changed', handleStorageChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('omoo:auth-changed', handleStorageChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setIsAdmin(false);
    setIsOpen(false);
    toast.success('Berhasil keluar dari akun.');
    window.dispatchEvent(new Event('omoo:auth-changed'));

    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Account Menu Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-1.5 px-2.5 border border-line/60 bg-surface/30 hover:border-ink hover:bg-surface text-ink text-[0.7rem] font-medium uppercase tracking-[0.1em] transition-all duration-300 ease-luxe cursor-pointer rounded-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className="w-3.5 h-3.5 text-accent" />
        <span className="hidden sm:inline font-sans truncate max-w-[120px]">
          {currentUser ? (isAdmin ? 'Admin' : currentUser.name.split(' ')[0]) : 'Akun'}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Smooth Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-64 origin-top-right border border-line bg-bg shadow-2xl z-[9999] p-2 space-y-1"
          >
            {currentUser ? (
              <>
                {/* User Identity Header */}
                <div className="px-3 py-2.5 border-b border-line bg-surface/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-medium text-ink truncate">
                      {currentUser.name}
                    </p>
                    {isAdmin ? (
                      <span className="px-1.5 py-0.5 text-[0.58rem] font-bold bg-ink text-bg uppercase tracking-widest">
                        ADMIN
                      </span>
                    ) : currentUser.memberTier === 'Collector' ? (
                      <span className="px-1.5 py-0.5 text-[0.58rem] font-semibold bg-accent-fill/30 text-ink border border-accent uppercase tracking-wider">
                        COLLECTOR
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[0.58rem] font-medium bg-surface text-muted border border-line uppercase">
                        MEMBER
                      </span>
                    )}
                  </div>
                  <p className="text-[0.65rem] text-muted truncate">{currentUser.email}</p>
                </div>

                {/* ADMIN OPTIONS */}
                {isAdmin && (
                  <>
                    <a
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-accent" />
                      <span>Dashboard Admin</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleToggleEditMode}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold text-ink hover:bg-surface transition-colors text-left cursor-pointer"
                    >
                      <Edit3 className={`w-4 h-4 ${isEditActive ? 'text-emerald-400' : 'text-accent'}`} />
                      <span>
                        {isEditActive ? 'Tutup Editor Visual' : 'Edit Teks & Foto Halaman'}
                      </span>
                    </button>
                  </>
                )}

                {/* COMMON OPTIONS */}
                <a
                  href="/account/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider text-muted hover:text-ink hover:bg-surface transition-colors"
                >
                  <Package className="w-4 h-4 text-muted" />
                  <span>My Orders</span>
                </a>

                <a
                  href="/member"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider text-muted hover:text-ink hover:bg-surface transition-colors"
                >
                  <Award className="w-4 h-4 text-muted" />
                  <span>Loyalty Membership</span>
                </a>

                {/* LOGOUT BUTTON */}
                <div className="pt-1 border-t border-line">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider font-medium text-red-600 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </>
            ) : (
              /* GUEST OPTIONS */
              <>
                <div className="px-3 py-2 border-b border-line">
                  <p className="text-[0.68rem] uppercase tracking-wider font-semibold text-ink">
                    Akun OMOO
                  </p>
                  <p className="text-[0.65rem] text-muted">
                    Masuk atau daftar untuk memantau riwayat pesanan Anda.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold text-ink hover:bg-surface transition-colors text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-accent" />
                  <span>Masuk / Daftar Akun</span>
                </button>

                <a
                  href="/account/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider text-muted hover:text-ink hover:bg-surface transition-colors"
                >
                  <Package className="w-4 h-4 text-muted" />
                  <span>My Orders</span>
                </a>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal Trigger for Guest */}
      <CustomerAccountModal
        forceOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
