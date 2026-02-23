
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

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  totalPrice: number;
  placeOrder: () => Promise<void>;
  placePendingOrder: () => Promise<any>;
  clearBackendCart: () => Promise<void>;
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

/* ---------------- PROVIDER ---------------- */

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [addedItemPopup, setAddedItemPopup] = useState<MenuItem | null>(null);

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
            description: mi.description,
            category: mi.category,
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
    } else if (!isUserLoading && !user) {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user, isUserLoading, fetchCart]);


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

  const placePendingOrder = useCallback(async () => {
    if (!supabase || !user || isUserLoading) return null;

    const orderItemsParam = state.items.map(item => ({
      menu_item_uuid: item.uuid,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    try {
      const { data, error } = await supabase.rpc("create_new_order", {
        user_id_param: user.id,
        user_name_param: userProfile?.name ?? user.email,
        total_amount_param: totalPrice,
        order_items_param: orderItemsParam,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      toast({
        title: "Order Failed",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  }, [
    supabase,
    user,
    userProfile,
    totalPrice,
    state.items,
    isUserLoading,
    toast,
  ]);


  const clearBackendCart = useCallback(async () => {
    if (!supabase || !user) return;

    const { error: deleteError } = await supabase
      .from('user_cart_items')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to clear cart from database:', deleteError);
    }
    dispatch({ type: "CLEAR_CART" });
  }, [supabase, user]);

  const placeOrder = useCallback(async () => {
    const data = await placePendingOrder();
    if (data && data.order_id) {
      await clearBackendCart();
      router.push(`/orders/${data.order_id}`);
    }
  }, [placePendingOrder, clearBackendCart, router]);

  /* -------- CONTEXT VALUE -------- */

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        totalItems,
        totalPrice,
        placeOrder,
        placePendingOrder,
        clearBackendCart,
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
