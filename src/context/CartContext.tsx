
"use client";

import type { CartItem, MenuItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useRouter } from "next/navigation";
import useSWR from "swr";


/* ---------------- TYPES ---------------- */

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" };

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  totalPrice: number;
  placeOrder: (paymentStatus?: string, isRazorpayCheckout?: boolean) => Promise<string | undefined>;
  fetchCart: (userId: string) => Promise<void>;
  updatingItemId: string | null;
  addItem: (item: MenuItem, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  addedItemPopup: MenuItem | null;
  setAddedItemPopup: React.Dispatch<React.SetStateAction<MenuItem | null>>;
}

/* ---------------- CONTEXT ---------------- */

const CartContext = createContext<CartContextType | null>(null);

/* ---------------- REDUCER ---------------- */

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_CART":
      return { items: action.payload };

    case "ADD_ITEM": {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter(i => i.id !== action.payload.id),
      };

    case "UPDATE_QUANTITY":
      return {
        items: state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ).filter(item => item.quantity > 0), // Also remove if quantity is 0
      };

    case "CLEAR_CART":
      return { items: [] };

    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [addedItemPopup, setAddedItemPopup] = useState<MenuItem | null>(null);

  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  /* -------- FETCH CART -------- */

  const fetcher = async ([_, userId]: [string, string]): Promise<CartItem[] | null> => {
    if (!supabase) return null;

    const { data: cartRows, error } = await supabase
      .from("user_cart_items")
      .select("menu_item_uuid, quantity")
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Failed to load cart", variant: "destructive" });
      return [];
    }

    if (!cartRows || cartRows.length === 0) {
      return [];
    }

    const uuids = cartRows.map(r => r.menu_item_uuid);

    const { data: menuItems, error: miError } = await supabase
      .from("menu_items")
      .select("*")
      .in("uuid", uuids);

    if (miError || !menuItems) {
      toast({ title: "Failed to load menu items", variant: "destructive" });
      return null;
    }

    return cartRows
      .map(row => {
        const mi = menuItems.find(m => m.uuid === row.menu_item_uuid);
        if (!mi) return null;

        return {
          id: mi.id,
          uuid: mi.uuid,
          name: mi.name,
          price: mi.price,
          stock: mi.stock,
          image: mi.image,
          quantity: row.quantity,
          description: mi.description,
          category: mi.category,
        };
      })
      .filter(Boolean) as CartItem[];
  };

  const { data: cartItems, mutate } = useSWR(
    user && !isUserLoading ? ['cart', user.id] : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  const fetchCart = useCallback(async (userId: string) => {
    if (user && user.id === userId) {
      await mutate();
    }
  }, [user, mutate]);

  useEffect(() => {
    if (cartItems) {
      dispatch({ type: "SET_CART", payload: cartItems });
    } else if (!isUserLoading && !user) {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [cartItems, user, isUserLoading]);


  /* -------- CART ACTIONS -------- */

  const removeItem = useCallback(async (itemId: string) => {
    if (!user || !supabase) return;

    const itemToRemove = state.items.find(i => i.id === itemId);
    if (!itemToRemove) return;

    setUpdatingItemId(itemId);
    try {
      const { error } = await supabase
        .from('user_cart_items')
        .delete()
        .match({ user_id: user.id, menu_item_uuid: itemToRemove.uuid });

      if (error) throw error;

      dispatch({ type: "REMOVE_ITEM", payload: { id: itemId } });
    } catch (err: any) {
      toast({ title: "Failed to remove item", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingItemId(null);
    }
  }, [supabase, user, state.items, toast]);


  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!user || !supabase) return;

    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    const itemToUpdate = state.items.find(i => i.id === itemId);
    if (!itemToUpdate) return;

    setUpdatingItemId(itemId);
    try {
      const { error } = await supabase
        .from('user_cart_items')
        .update({ quantity })
        .match({ user_id: user.id, menu_item_uuid: itemToUpdate.uuid });

      if (error) throw error;

      dispatch({ type: "UPDATE_QUANTITY", payload: { id: itemId, quantity } });
    } catch (err: any) {
      toast({ title: "Failed to update cart", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingItemId(null);
    }
  }, [supabase, user, state.items, toast, removeItem]);

  const addItem = useCallback(async (item: MenuItem, quantity: number = 1) => {
    if (!user || !supabase) return;

    if (user.is_anonymous) {
      toast({ title: 'Please log in', description: 'Create an account to add items to your cart.', variant: 'destructive' });
      router.push('/login');
      return;
    }

    setUpdatingItemId(item.id);
    try {
      const existingItem = state.items.find(i => i.id === item.id);

      if (existingItem) {
        await updateQuantity(item.id, existingItem.quantity + quantity);
      } else {
        const { error } = await supabase
          .from('user_cart_items')
          .insert({
            user_id: user.id,
            menu_item_uuid: item.uuid,
            quantity: quantity,
          });

        if (error) throw error;

        const newCartItem: CartItem = { ...item, quantity: quantity };
        dispatch({ type: "ADD_ITEM", payload: newCartItem });
        setAddedItemPopup(item);
        playAddToCartSound();
      }
    } catch (err: any) {
      toast({ title: "Failed to add item", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingItemId(null);
    }
  }, [supabase, user, state.items, toast, updateQuantity, router]);


  /* -------- TOTALS -------- */

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

  /* -------- PLACE ORDER -------- */

  const placeOrder = useCallback(async (paymentStatus?: string, isRazorpayCheckout: boolean = false) => {
    if (!supabase || !user || isUserLoading) return;

    const orderItemsParam = state.items.map(item => ({
      menu_item_uuid: item.uuid, // MUST be uuid
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    // 🔍 STEP 1 LOG — DO NOT SKIP
    console.log(
      "ORDER ITEMS PARAM (FRONTEND → RPC)",
      JSON.stringify(orderItemsParam, null, 2)
    );

    try {
      const { data, error } = await supabase.rpc("create_new_order", {
        user_id_param: user.id,
        user_name_param: userProfile?.name ?? user.email,
        total_amount_param: totalPrice,
        order_items_param: orderItemsParam,
      });

      if (error) throw error;

      if (paymentStatus && data?.order_id) {
        const updatePayload: any = { payment_status: paymentStatus };
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

      dispatch({ type: "CLEAR_CART" });
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
  }, [
    supabase,
    user,
    userProfile,
    totalPrice,
    state.items,
    isUserLoading,
    toast,
    router,
  ]);

  /* -------- CONTEXT VALUE -------- */

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        totalItems,
        totalPrice,
        placeOrder,
        fetchCart,
        updatingItemId,
        addItem,
        updateQuantity,
        removeItem,
        addedItemPopup,
        setAddedItemPopup,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
