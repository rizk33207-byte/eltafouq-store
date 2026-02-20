"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "./cart-types";

interface CartStore {
  items: CartItem[];
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

const sumTotal = (items: CartItem[]): number =>
  items.reduce((accumulator, item) => accumulator + item.price * item.qty, 0);

const sumCount = (items: CartItem[]): number =>
  items.reduce((accumulator, item) => accumulator + item.qty, 0);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      add: (item, qty = 1) =>
        set((state) => {
          const existingItem = state.items.find((cartItem) => cartItem.id === item.id);

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === item.id
                  ? { ...cartItem, qty: cartItem.qty + qty }
                  : cartItem,
              ),
            };
          }

          return {
            items: [...state.items, { ...item, qty }],
          };
        }),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      inc: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item,
          ),
        })),
      dec: (id) =>
        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.id !== id) {
              return [item];
            }

            if (item.qty <= 1) {
              return [];
            }

            return [{ ...item, qty: item.qty - 1 }];
          }),
        })),
      clear: () => set({ items: [] }),
      total: () => sumTotal(get().items),
      count: () => sumCount(get().items),
    }),
    {
      name: "eltafouk-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
