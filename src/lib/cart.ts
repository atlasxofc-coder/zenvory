import { useSyncExternalStore } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  image: string | null;
  priceCents: number;
  quantity: number;
  maxStock: number;
};

const KEY = "zenvori-cart-v1";
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    items = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    items = [];
  }
}

function emit() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const cart = {
  add(item: Omit<CartItem, "quantity">, qty = 1) {
    load();
    const existing = items.find((i) => i.variantId === item.variantId);
    if (existing) {
      items = items.map((i) =>
        i.variantId === item.variantId ? { ...i, ...item, quantity: Math.min(i.quantity + qty, item.maxStock) } : i,
      );
    } else {
      items = [...items, { ...item, quantity: Math.min(qty, item.maxStock) }];
    }
    emit();
  },
  setQty(variantId: string, qty: number) {
    load();
    items = items
      .map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(0, Math.min(qty, i.maxStock)) } : i))
      .filter((i) => i.quantity > 0);
    emit();
  },
  remove(variantId: string) {
    load();
    items = items.filter((i) => i.variantId !== variantId);
    emit();
  },
  clear() {
    items = [];
    emit();
  },
};

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      listeners.forEach((x) => x());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const list = useSyncExternalStore(
    subscribe,
    () => {
      load();
      return items;
    },
    () => EMPTY,
  );
  const count = list.reduce((s, i) => s + i.quantity, 0);
  const subtotal = list.reduce((s, i) => s + i.quantity * i.priceCents, 0);
  return { items: list, count, subtotal };
}
