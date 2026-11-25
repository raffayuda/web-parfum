import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import {
  type CartItem,
  getCartItems,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  formatIdr,
} from '../../lib/cart';
import { resolvePublicImageUrl } from '../../data/images';

export const CartDrawer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setMounted(true);
    const sync = () => setItems(getCartItems());
    sync();

    const handleOpen = () => {
      sync();
      setIsOpen(true);
    };

    window.addEventListener('omoo:cart-changed', sync);
    window.addEventListener('omoo:open-cart', handleOpen);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('omoo:cart-changed', sync);
      window.removeEventListener('omoo:open-cart', handleOpen);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#070906]/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang Belanja"
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bg border-l border-line shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-line flex items-center justify-between">
              <div>
                <span className="text-[0.6rem] uppercase tracking-[0.16em] text-accent font-semibold block">
                  Keranjang Belanja
                </span>
                <h2 className="font-display text-2xl text-ink font-normal mt-0.5">
                  Pilihan Anda ({totalCount})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup keranjang"
                className="p-1.5 text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length > 0 ? (
                items.map((item) => {
                  const key = item.slug || item.id || item.name;
                  return (
                    <div
                      key={key}
                      className="flex gap-3.5 p-3 border border-line bg-surface/20"
                    >
                      <div className="w-16 h-20 border border-line bg-surface overflow-hidden shrink-0">
                        <img
                          src={resolvePublicImageUrl(item.bottleImage)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[0.58rem] uppercase tracking-wider text-muted block">
                              {item.edition}
                            </span>
                            <h3 className="font-display text-lg text-ink font-normal truncate leading-tight">
                              {item.name}
                            </h3>
                            <p className="text-[0.65rem] text-muted">{item.volume}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(key)}
                            aria-label={`Hapus ${item.name}`}
                            className="p-1 text-muted hover:text-red-600 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="inline-flex items-center border border-line bg-bg">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(key, -1)}
                              aria-label="Kurangi jumlah"
                              className="w-6 h-6 flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(key, 1)}
                              aria-label="Tambah jumlah"
                              className="w-6 h-6 flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-semibold text-ink">
                            {formatIdr(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center space-y-4">
                  <ShoppingBag className="w-10 h-10 text-muted/60 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-display text-xl text-ink">Keranjang Masih Kosong</p>
                    <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
                      Tambahkan satu atau beberapa varian parfum ke keranjang sebelum menuju checkout.
                    </p>
                  </div>
                  <a
                    href="/collection"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-ink bg-ink text-bg text-xs uppercase tracking-[0.12em] font-semibold hover:bg-ink/85 transition-colors"
                  >
                    <span>Jelajahi Koleksi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-line bg-surface/25 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted">
                    Subtotal ({totalCount} item)
                  </span>
                  <span className="font-display text-2xl text-ink font-semibold">
                    {formatIdr(totalAmount)}
                  </span>
                </div>

                <div className="space-y-2">
                  <a
                    href="/checkout?mode=cart"
                    onClick={() => setIsOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-ink text-bg hover:bg-ink/90 text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
                  >
                    <span>Checkout Sekarang</span>
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                    }}
                    className="w-full py-2 text-[0.68rem] uppercase tracking-[0.12em] text-muted hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Kosongkan Keranjang
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Buka keranjang (${totalCount} item)`}
        className="relative inline-flex items-center gap-1.5 text-[0.7rem] font-medium uppercase leading-none tracking-[0.1em] text-muted transition-colors duration-300 ease-luxe hover:text-ink cursor-pointer p-1"
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="hidden md:inline">Bag</span>
        {totalCount > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center bg-ink text-bg text-[0.58rem] font-bold leading-none">
            {totalCount}
          </span>
        )}
      </button>

      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
};
