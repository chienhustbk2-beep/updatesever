import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem { productId: string; name: string; price: number; salePrice?: number; image?: string; quantity: number; bulkDiscounts?: { minQty: number; discount: number }[] }
export interface UnavailableItem { id: string; name: string; reason: "hidden" | "out_of_stock" }
export interface StockWarning { id: string; name: string; available: number; requested: number }
interface CartState { cartItems: CartItem[]; unavailableItems: UnavailableItem[]; stockWarnings: StockWarning[]; addToCart: (item: CartItem) => void; removeFromCart: (productId: string) => void; updateQuantity: (productId: string, quantity: number) => void; clearCart: () => void; clearWarnings: () => void; getTotalItems: () => number; getTotalPrice: () => number; syncToServer: () => Promise<void>; _hasHydrated: boolean }
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function debounceSync(syncFn: () => Promise<void>) {
  if (syncTimeout) {
    clearTimeout(syncTimeout) }
  syncTimeout = setTimeout(() => {
    syncFn();
    syncTimeout = null }, 1000) }

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      unavailableItems: [],
      stockWarnings: [],
      _hasHydrated: false,

      addToCart: (item: CartItem) => {
        try {
          console.log('[Cart] addToCart called with:', item);
          set((state) => {
            const currentItems = Array.isArray(state.cartItems) ? state.cartItems.length : 'NOT_ARRAY';
            console.log('[Cart] Current cartItems count:', currentItems);
            if (!Array.isArray(state.cartItems)) {
              console.error('[Cart] cartItems is not an array:', state.cartItems);
              return { cartItems: [item] };
            }
            const existingItem = state.cartItems.find(
              (cartItem) => cartItem.productId === item.productId,
            );
            if (existingItem) {
              console.log('[Cart] Item exists, incrementing quantity');
              return {
                cartItems: state.cartItems.map((cartItem) =>
                  cartItem.productId === item.productId
                    ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                    : cartItem,
                ),
              };
            }
            console.log('[Cart] Adding new item');
            return { cartItems: [...state.cartItems, item] };
          });
          console.log('[Cart] State after set, cartItems:', get().cartItems.length, 'items');
          debounceSync(() => get().syncToServer())
        } catch (err) {
          console.error('[Cart] addToCart error:', err);
        }
      },

      removeFromCart: (productId: string) => {
        set((state) => ({
          cartItems: state.cartItems.filter(
            (item) => item.productId !== productId,
          ),
        }));

        debounceSync(() => get().syncToServer()) },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return }

        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        }));

        debounceSync(() => get().syncToServer()) },

      clearCart: () => {
        set({ cartItems: [], unavailableItems: [], stockWarnings: [] }) },
      clearWarnings: () => {
        set({ unavailableItems: [], stockWarnings: [] }) },

      getTotalItems: () => {
        return get().cartItems.reduce(
          (total, item) => total + item.quantity,
          0,
        ) },

      getTotalPrice: () => {
        return get().cartItems.reduce((total, item) => {
          const price = item.salePrice ?? item.price;
          return total + price * item.quantity }, 0) },

      syncToServer: async () => {
        const cartItems = get().cartItems;
        if (cartItems.length === 0) return;

        try {
          const res = await fetch("/api/cart/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cartItems }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.unavailableProducts) {
              set({ unavailableItems: data.unavailableProducts, stockWarnings: data.stockWarnings || [] });
            } else {
              set({ unavailableItems: [], stockWarnings: [] });
            }
          }
        } catch (err) {
          console.error("Failed to sync cart to server:", err) }
      },
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            (state as CartState)._hasHydrated = true;
          }
        };
      },
    },
  ),
);
