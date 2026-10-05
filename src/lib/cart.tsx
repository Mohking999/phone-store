import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: string; slug: string; name: string; sku: string; price: number; image: string; stock: number; quantity: number };

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("cart") || "[]"));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("cart", JSON.stringify(items));
  }, [items, ready]);

  const add: CartCtx["add"] = (item, qty = 1) =>
    setItems((prev) => {
      const ex = prev.find((i) => i.id === item.id);
      if (ex) return prev.map((i) => (i.id === item.id ? { ...i, quantity: Math.min(i.stock, i.quantity + qty) } : i));
      return [...prev, { ...item, quantity: Math.min(item.stock, qty) }];
    });
  const setQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(i.stock, qty)) } : i)));
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  return (
    <Ctx.Provider
      value={{
        items, add, setQty, remove, clear,
        count: items.reduce((s, i) => s + i.quantity, 0),
        subtotal: items.reduce((s, i) => s + i.quantity * i.price, 0),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
