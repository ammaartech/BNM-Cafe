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

/* ---------------- CONTEXT ---------------- */

const CartContext = createContext<any>(null);

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

/* ---------------- PROVIDER ---------------- */

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  /* -------- FETCH CART -------- */

  const fetchCart = useCallback(
    async (userId: string) => {
      if (!supabase) return;

      const { data: cartRows, error } = await supabase
        .from("user_cart_items")
        .select("menu_item_uuid, quantity")
        .eq("user_id", userId);

      if (error) {
        toast({ title: "Failed to load cart", variant: "destructive" });
        dispatch({ type: "SET_CART", payload: [] });
        return;
      }

      if (!cartRows || cartRows.length === 0) {
        dispatch({ type: "SET_CART", payload: [] });
        return;
      }

      const uuids = cartRows.map(r => r.menu_item_uuid);

      const { data: menuItems, error: miError } = await supabase
        .from("menu_items")
        .select("*")
        .in("uuid", uuids);

      if (miError || !menuItems) {
        toast({ title: "Failed to load menu items", variant: "destructive" });
        return;
      }

      const items: CartItem[] = cartRows
        .map(row => {
          const mi = menuItems.find(m => m.uuid === row.menu_item_uuid);
          if (!mi) return null;

          return {
            id: mi.id,
            uuid: mi.uuid, // 🔥 THIS IS CRITICAL
            name: mi.name,
            price: mi.price,
            stock: mi.stock,
            image: mi.image,
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
  }, [user, isUserLoading, fetchCart]);

  /* -------- TOTALS -------- */

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

  /* -------- PLACE ORDER -------- */

  const placeOrder = useCallback(async () => {
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useCart() {
  return useContext(CartContext);
}
