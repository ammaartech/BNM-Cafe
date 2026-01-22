"use client";

import type {
  CartItem,
  MenuItem,
} from "@/lib/types";
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

/* ================================
   TYPES
================================ */

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" };

type CartContextType = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  totalPrice: number;
  placeOrder: () => Promise<void>;
  addedItemPopup: MenuItem | null;
  setAddedItemPopup: (item: MenuItem | null) => void;
  isCartLoading: boolean;
  addItem: (item: MenuItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  updatingItemId: string | null;
  fetchCart: (userId: string) => Promise<void>;
};

/* ================================
   CONTEXT
================================ */

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ================================
   REDUCER
================================ */

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
              ? { ...i, quantity: i.quantity + 1 }
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
        ),
      };

    case "CLEAR_CART":
      return { items: [] };

    default:
      return state;
  }
}

/* ================================
   PROVIDER
================================ */

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [addedItemPopup, setAddedItemPopup] = useState<MenuItem | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  /* ================================
     FETCH CART
  ================================ */

  const fetchCart = useCallback(
    async (userId: string) => {
      if (!supabase) return;

      const { data: cartRows, error } = await supabase
        .from("user_cart_items")
        .select("menu_item_uuid, quantity")
        .eq("user_id", userId);

      if (error) {
        toast({
          title: "Error",
          description: "Could not load your cart.",
          variant: "destructive",
        });
        dispatch({ type: "SET_CART", payload: [] });
        return;
      }

      if (!cartRows || cartRows.length === 0) {
        dispatch({ type: "SET_CART", payload: [] });
        return;
      }

      const uuids = cartRows.map(r => r.menu_item_uuid);

      const { data: menuItems, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .in("uuid", uuids);

      if (menuError || !menuItems) {
        toast({
          title: "Error",
          description: "Could not load menu item details.",
          variant: "destructive",
        });
        dispatch({ type: "SET_CART", payload: [] });
        return;
      }

      const items: CartItem[] = cartRows
        .map(row => {
          const mi = menuItems.find(m => m.uuid === row.menu_item_uuid);
          if (!mi) return null;
          return {
            ...mi,
            quantity: row.quantity,
          };
        })
        .filter(Boolean) as CartItem[];

      dispatch({ type: "SET_CART", payload: items });
    },
    [supabase, toast]
  );

  useEffect(() => {
    if (!isUserLoading && user) {
      fetchCart(user.id);
    }
    if (!isUserLoading && !user) {
      dispatch({ type: "SET_CART", payload: [] });
    }
  }, [isUserLoading, user, fetchCart]);

  /* ================================
     TOTALS
  ================================ */

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

  /* ================================
     PLACE ORDER (UUID SAFE)
  ================================ */

  const placeOrder = useCallback(async () => {
    if (isUserLoading || !user || !supabase) return;

    if (state.items.length === 0) {
      toast({
        title: "Cart empty",
        description: "Add items before placing an order.",
        variant: "destructive",
      });
      return;
    }

    const customerName = userProfile?.name || user.email;
    if (!customerName) return;

    try {
      const orderItemsParam = state.items.map(item => ({
        menu_item_uuid: item.uuid, // ✅ UUID ONLY
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { data, error } = await supabase.rpc("create_new_order", {
        user_id_param: user.id,
        user_name_param: customerName,
        total_amount_param: totalPrice,
        order_items_param: orderItemsParam,
      });

      if (error) throw error;
      if (!data?.order_id) throw new Error("Order not created");

      await supabase
        .from("user_cart_items")
        .delete()
        .eq("user_id", user.id);

      dispatch({ type: "CLEAR_CART" });
      router.push(`/orders/${data.order_id}`);
    } catch (err: any) {
      toast({
        title: "Order Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [
    isUserLoading,
    user,
    supabase,
    state.items,
    totalPrice,
    toast,
    userProfile,
    router,
  ]);

  /* ================================
     ADD / REMOVE / UPDATE
  ================================ */

  const addItem = async (item: MenuItem) => {
    if (!user || !supabase) return;

    setUpdatingItemId(item.id);

    dispatch({ type: "ADD_ITEM", payload: { ...item, quantity: 1 } });

    await supabase.from("user_cart_items").upsert(
      {
        user_id: user.id,
        menu_item_uuid: item.uuid,
        quantity: 1,
      },
      { onConflict: "user_id,menu_item_uuid" }
    );

    setAddedItemPopup(item);
    setUpdatingItemId(null);
  };

  const removeItem = async (id: string) => {
    if (!user || !supabase) return;

    const item = state.items.find(i => i.id === id);
    if (!item) return;

    dispatch({ type: "REMOVE_ITEM", payload: { id } });

    await supabase
      .from("user_cart_items")
      .delete()
      .match({ user_id: user.id, menu_item_uuid: item.uuid });
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!user || !supabase) return;

    const item = state.items.find(i => i.id === id);
    if (!item) return;

    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { id, quantity },
    });

    await supabase
      .from("user_cart_items")
      .update({ quantity })
      .match({ user_id: user.id, menu_item_uuid: item.uuid });
  };

  const clearCart = async () => {
    if (!user || !supabase) return;
    dispatch({ type: "CLEAR_CART" });
    await supabase.from("user_cart_items").delete().eq("user_id", user.id);
  };

  /* ================================
     PROVIDER
  ================================ */

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        totalItems,
        totalPrice,
        placeOrder,
        addedItemPopup,
        setAddedItemPopup,
        isCartLoading: isUserLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        updatingItemId,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/* ================================
   HOOK
================================ */

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
};
