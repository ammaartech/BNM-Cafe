"use client";

import type { CartItem, MenuItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { MENU_COLUMNS } from "@/lib/data";

/* ---------------- TYPES ---------------- */

interface CartContextType {
  state: { items: CartItem[] };
  totalItems: number;
  totalPrice: number;
  placeOrder: (paymentStatus?: string, isRazorpayCheckout?: boolean) => Promise<string | undefined>;
  addItem: (item: MenuItem, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  addedItemPopup: MenuItem | null;
  setAddedItemPopup: React.Dispatch<React.SetStateAction<MenuItem | null>>;
}

type DbResult = PromiseLike<{ error: { message: string } | null }>;

/* ---------------- CONTEXT ---------------- */

const CartContext = createContext<CartContextType | null>(null);

const EMPTY: CartItem[] = [];

/* ---------------- HELPER ---------------- */

const playAddToCartSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();

    // Helper to play a single note
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, startTime);
      // Fast attack
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      // Smooth release
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Play a nice two-tone chime (E6 to A6 - perfect fourth interval up)
    playNote(1318.51, audioCtx.currentTime, 0.15);       // E6
    playNote(1760.00, audioCtx.currentTime + 0.1, 0.3);  // A6
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

/* ---------------- PROVIDER ---------------- */

export function CartProvider({ children }: { children: ReactNode }) {
  const [addedItemPopup, setAddedItemPopup] = useState<MenuItem | null>(null);

  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();
  const { mutate: mutateGlobal } = useSWRConfig();

  /* -------- FETCH CART -------- */

  const fetchCart = useCallback(async ([, userId]: readonly [string, string]): Promise<CartItem[]> => {
    const { data: cartRows, error } = await supabase
      .from("user_cart_items")
      .select("menu_item_uuid, quantity")
      .eq("user_id", userId);

    if (error) throw error;
    if (!cartRows?.length) return [];

    const { data: menuItems, error: miError } = await supabase
      .from("menu_items")
      .select(MENU_COLUMNS)
      .in("uuid", cartRows.map(r => r.menu_item_uuid));

    if (miError) throw miError;

    const byUuid = new Map((menuItems as MenuItem[]).map(m => [m.uuid, m]));
    return cartRows.flatMap(row => {
      const mi = byUuid.get(row.menu_item_uuid);
      return mi ? [{ ...mi, quantity: row.quantity }] : [];
    });
  }, [supabase]);

  const { data, mutate } = useSWR(
    user && !user.is_anonymous ? (["cart", user.id] as const) : null,
    fetchCart,
    { onError: () => toast({ title: "Failed to load cart", variant: "destructive" }) }
  );

  const items = user ? data ?? EMPTY : EMPTY;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  /* -------- CART ACTIONS -------- */

  // Every change shows on screen at once; the database writes run one after
  // another, so a fast "+ + -" can't reach the server out of order. If a write
  // fails, the cart is reloaded from the server so the screen can't drift from it.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const apply = useCallback((next: CartItem[], write: () => DbResult, failTitle: string) => {
    mutate(next, { revalidate: false });
    const job = queueRef.current.then(async () => {
      const { error } = await write();
      if (error) throw error;
    });
    queueRef.current = job.catch(() => undefined);
    return job.catch((err: { message?: string }) => {
      toast({ title: failTitle, description: err?.message, variant: "destructive" });
      mutate();
    });
  }, [mutate, toast]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!user) return;
    const target = itemsRef.current.find(i => i.id === itemId);
    if (!target) return;

    await apply(
      itemsRef.current.filter(i => i.id !== itemId),
      () => supabase.from("user_cart_items").delete().match({ user_id: user.id, menu_item_uuid: target.uuid }),
      "Failed to remove item"
    );
  }, [supabase, user, apply]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) return removeItem(itemId);

    const target = itemsRef.current.find(i => i.id === itemId);
    if (!target) return;

    await apply(
      itemsRef.current.map(i => (i.id === itemId ? { ...i, quantity } : i)),
      () => supabase.from("user_cart_items").update({ quantity }).match({ user_id: user.id, menu_item_uuid: target.uuid }),
      "Failed to update cart"
    );
  }, [supabase, user, apply, removeItem]);

  const addItem = useCallback(async (item: MenuItem, quantity: number = 1) => {
    if (!user) return;

    if (user.is_anonymous) {
      toast({ title: 'Please log in', description: 'Create an account to add items to your cart.', variant: 'destructive' });
      router.push('/login');
      return;
    }

    // New object identity so re-adding the same item resets the popup's dismiss timer
    setAddedItemPopup({ ...item });
    playAddToCartSound();

    const existing = itemsRef.current.find(i => i.id === item.id);
    if (existing) {
      return updateQuantity(item.id, existing.quantity + quantity);
    }

    await apply(
      [...itemsRef.current, { ...item, quantity }],
      () => supabase.from("user_cart_items").insert({ user_id: user.id, menu_item_uuid: item.uuid, quantity }),
      "Failed to add item"
    );
  }, [supabase, user, toast, router, apply, updateQuantity]);

  /* -------- TOTALS -------- */

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  /* -------- PLACE ORDER -------- */

  const placeOrder = useCallback(async (paymentStatus?: string, isRazorpayCheckout: boolean = false) => {
    if (!user || isUserLoading) return;

    // Let any cart edit still in flight land first, so the order matches the screen.
    await queueRef.current;

    const cart = itemsRef.current;
    const orderItemsParam = cart.map(item => ({
      menu_item_uuid: item.uuid, // MUST be uuid
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    try {
      const { data, error } = await supabase.rpc("create_new_order", {
        user_id_param: user.id,
        user_name_param: userProfile?.name ?? user.email,
        total_amount_param: total,
        order_items_param: orderItemsParam,
      });

      if (error) throw error;

      if (paymentStatus && data?.order_id) {
        const updatePayload: Record<string, string> = { payment_status: paymentStatus };
        if (paymentStatus === 'PAID') {
          updatePayload.payment_method = 'RAZORPAY';
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', data.order_id);

        if (updateError) {
          console.error('Failed to update payment status:', updateError);
        }
      }

      // Manually clear the cart from the database after a successful order.
      const { error: deleteError } = await supabase
        .from('user_cart_items')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        // Log the error but don't block the user flow since the order was successful.
        console.error('Failed to clear cart from database:', deleteError);
      }

      mutate([], { revalidate: false });
      // The new order belongs at the top of "My Orders".
      mutateGlobal((key) => Array.isArray(key) && key[0] === "orders");

      if (!isRazorpayCheckout) {
        router.push(`/orders/${data.order_id}`);
      }
      return data.order_id;
    } catch (err: any) {
      toast({
        title: "Order Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [supabase, user, userProfile, isUserLoading, toast, router, mutate, mutateGlobal]);

  /* -------- CONTEXT VALUE -------- */

  const value = useMemo(() => ({
    state: { items },
    totalItems,
    totalPrice,
    placeOrder,
    addItem,
    updateQuantity,
    removeItem,
    addedItemPopup,
    setAddedItemPopup,
  }), [items, totalItems, totalPrice, placeOrder, addItem, updateQuantity, removeItem, addedItemPopup]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ---------------- HOOK ---------------- */

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
