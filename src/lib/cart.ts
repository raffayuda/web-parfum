export interface CartItem {
  id?: string;
  slug: string;
  name: string;
  edition: string;
  volume: string;
  price: number;
  bottleImage: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'omoo_cart_items';

function emitCartChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omoo:cart-changed'));
  }
}

export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && item.name && Number(item.price) > 0)
      .map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  emitCartChange();
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1): CartItem[] {
  const current = getCartItems();
  const key = item.slug || item.id || item.name;
  const idx = current.findIndex((c) => (c.slug || c.id || c.name) === key);

  let next: CartItem[];
  if (idx >= 0) {
    next = current.map((c, i) =>
      i === idx ? { ...c, quantity: c.quantity + Math.max(1, quantity) } : c
    );
  } else {
    next = [...current, { ...item, quantity: Math.max(1, quantity) }];
  }

  saveCartItems(next);
  return next;
}

export function updateCartQuantity(key: string, delta: number): CartItem[] {
  const current = getCartItems();
  const next = current
    .map((item) => {
      const itemKey = item.slug || item.id || item.name;
      if (itemKey !== key) return item;
      return { ...item, quantity: item.quantity + delta };
    })
    .filter((item) => item.quantity > 0);

  saveCartItems(next);
  return next;
}

export function removeFromCart(key: string): CartItem[] {
  const current = getCartItems();
  const next = current.filter((item) => (item.slug || item.id || item.name) !== key);
  saveCartItems(next);
  return next;
}

export function clearCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
  emitCartChange();
}

export function openCartDrawer() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omoo:open-cart'));
  }
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
