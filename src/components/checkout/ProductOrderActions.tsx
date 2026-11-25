import React, { useState } from 'react';
import { QrCode, MessageSquare, ShoppingBag, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { addToCart, openCartDrawer } from '../../lib/cart';

export interface ProductOrderActionsProps {
  product: {
    id?: string;
    slug?: string;
    name: string;
    volume: string;
    price: number;
    edition?: string;
    bottleImage?: string;
    isAvailable?: boolean;
  };
  whatsappUrl: string;
}

export const ProductOrderActions: React.FC<ProductOrderActionsProps> = ({
  product,
  whatsappUrl,
}) => {
  const [qty, setQty] = useState(1);
  const isAvailable = product.isAvailable !== false;
  const checkoutUrl = `/checkout?product=${encodeURIComponent(product.slug || product.id || product.name)}`;

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
        name: product.name,
        edition: product.edition || 'OMOO',
        volume: product.volume,
        price: Number(product.price) || 0,
        bottleImage: product.bottleImage || '/images/bottle-vetiver.jpg',
      },
      qty
    );
    toast.success(`${qty}x ${product.name} ditambahkan ke keranjang!`);
    openCartDrawer();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {isAvailable ? (
        <>
          {/* Quantity + Add to Cart Row */}
          <div className="flex gap-2.5 w-full">
            <div className="inline-flex items-center border border-line bg-surface/40 shrink-0">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Kurangi jumlah"
                className="w-10 h-full flex items-center justify-center text-muted hover:text-ink cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs font-semibold text-ink">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Tambah jumlah"
                className="w-10 h-full flex items-center justify-center text-muted hover:text-ink cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-ink text-bg text-xs uppercase tracking-[0.12em] font-medium hover:bg-ink/90 transition-all duration-300 ease-luxe cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 text-accent" />
              <span>Tambah ke Keranjang</span>
            </button>
          </div>

          {/* Direct Checkout QRIS */}
          <a
            href={checkoutUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-line bg-surface/30 hover:border-ink hover:bg-surface text-ink text-xs uppercase tracking-[0.12em] font-medium transition-all duration-300 ease-luxe text-center"
          >
            <QrCode className="w-4 h-4 text-accent" />
            <span>Beli Langsung via QRIS</span>
          </a>

          {/* Secondary Action: WhatsApp Order */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-line bg-transparent hover:border-ink text-muted hover:text-ink text-xs uppercase tracking-[0.12em] font-medium transition-all duration-300 ease-luxe"
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>Pesan via WhatsApp Admin</span>
          </a>
        </>
      ) : (
        <div className="p-4 border border-line bg-surface/40 text-center space-y-1">
          <p className="text-xs uppercase font-semibold tracking-[0.1em] text-muted line-through">
            Stok Habis Sementara
          </p>
          <p className="text-[0.72rem] text-muted">
            Batch berikutnya sedang disiapkan. Hubungi kami via WhatsApp untuk reservasi atau info ketersediaan.
          </p>
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.68rem] text-accent uppercase font-medium tracking-[0.1em] hover:underline"
            >
              Hubungi via WhatsApp &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
