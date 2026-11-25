import React from 'react';
import { QrCode, MessageSquare } from 'lucide-react';

export interface ProductOrderActionsProps {
  product: {
    id?: string;
    slug?: string;
    name: string;
    volume: string;
    price: number;
    edition?: string;
    isAvailable?: boolean;
  };
  whatsappUrl: string;
}

export const ProductOrderActions: React.FC<ProductOrderActionsProps> = ({
  product,
  whatsappUrl,
}) => {
  const isAvailable = product.isAvailable !== false;
  const checkoutUrl = `/checkout?product=${encodeURIComponent(product.slug || product.id || product.name)}`;

  return (
    <div className="w-full flex flex-col gap-3">
      {isAvailable ? (
        <>
          {/* Primary Action: QRIS Web Checkout Direct Page */}
          <a
            href={checkoutUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-ink text-bg text-xs uppercase tracking-[0.12em] font-medium hover:bg-ink/90 transition-all duration-300 ease-luxe cursor-pointer shadow-sm text-center"
          >
            <QrCode className="w-4 h-4" />
            <span>Bayar via QRIS & Lacak Pesanan</span>
          </a>

          {/* Secondary Action: WhatsApp Order */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-line bg-surface/30 hover:border-ink hover:bg-surface text-ink text-xs uppercase tracking-[0.12em] font-medium transition-all duration-300 ease-luxe"
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>Pesan via WhatsApp Concierge</span>
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
