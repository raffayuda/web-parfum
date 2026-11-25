import React, { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { toast } from 'sonner';
import { addToCart, openCartDrawer } from '../../lib/cart';
import { resolvePublicImageUrl } from '../../data/images';

export interface AddToCartButtonProps {
  product: {
    id?: string;
    slug: string;
    name: string;
    edition: string;
    volume: string;
    price: number;
    bottleImage: string;
    isAvailable?: boolean;
  };
  openDrawerAfterAdd?: boolean;
  className?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  openDrawerAfterAdd = false,
  className = '',
}) => {
  const [justAdded, setJustAdded] = useState(false);

  if (product.isAvailable === false) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        edition: product.edition,
        volume: product.volume,
        price: Number(product.price) || 0,
        bottleImage: resolvePublicImageUrl(product.bottleImage),
      },
      1
    );

    setJustAdded(true);
    toast.success(`${product.name} ditambahkan ke keranjang.`);
    if (openDrawerAfterAdd) {
      openCartDrawer();
    }
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 border border-line bg-surface/30 hover:border-ink hover:bg-surface text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink transition-colors cursor-pointer ${className}`}
    >
      {justAdded ? (
        <>
          <Check className="w-3.5 h-3.5 text-accent" />
          <span>Ditambahkan</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-3.5 h-3.5 text-accent" />
          <span>+ Keranjang</span>
        </>
      )}
    </button>
  );
};
