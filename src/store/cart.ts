import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@vision-pro/types";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartLine[];
  add: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((state) => {
          if (product.stockQuantity <= 0) return state;
          const existing = state.items.find((line) => line.product.id === product.id);
          if (!existing) return { items: [...state.items, { product, quantity: 1 }] };
          return {
            items: state.items.map((line) =>
              line.product.id === product.id
                ? { ...line, product, quantity: Math.min(product.stockQuantity, line.quantity + 1) }
                : line,
            ),
          };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((line) =>
              line.product.id === productId
                ? { ...line, quantity: Math.max(1, Math.min(line.product.stockQuantity, quantity)) }
                : line,
            )
            .filter((line) => line.product.stockQuantity > 0),
        })),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((line) => line.product.id !== productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "vision-pro-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export const formatDZD = (amount: number) =>
  `${new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(amount).replace(/[\u202f\u00a0]/g, " ")} DA`;
