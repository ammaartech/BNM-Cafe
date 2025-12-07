
"use client";

import type { CartItem, MenuItem, Order, OrderItem, UserProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useRouter } from "next/navigation";


type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "CLEAR_CART" };


const CartContext = createContext<{
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
}>({
  state: { items: [] },
  dispatch: () => null,
  totalItems: 0,
  totalPrice: 0,
  placeOrder: async () => {},
  addedItemPopup: null,
  setAddedItemPopup: () => {},
  isCartLoading: true,
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
});

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_CART":
        return { ...state, items: action.payload };
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += 1;
        return { ...state, items: newItems };
      } else {
        return { ...state, items: [...state.items, action.payload] };
      }
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== action.payload.id),
        };
      }
      const newItems = state.items.map((item) => 
        item.id === action.payload.id 
          ? { ...item, quantity: action.payload.quantity } 
          : item
      );
      return { ...state, items: newItems };
    }
    case "CLEAR_CART":
        return { ...state, items: [] };
    default:
      return state;
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [addedItemPopup, setAddedItemPopup] = useState<MenuItem | null>(null);
  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  const fetchCart = useCallback(async () => {
    if (!user || user.is_anonymous || !supabase) {
      dispatch({ type: "SET_CART", payload: [] });
      return;
    }

    const { data: cartData, error: cartError } = await supabase
      .from('user_cart_items')
      .select('menu_item_id, quantity')
      .eq('user_id', user.id);

    if (cartError) {
      toast({ title: "Error", description: "Could not load your cart.", variant: "destructive" });
      return;
    }

    if (!cartData || cartData.length === 0) {
        dispatch({ type: "SET_CART", payload: [] });
        return;
    }

    const menuItemIds = cartData.map(item => item.menu_item_id);
    const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .in('id', menuItemIds);
    
    if (menuItemsError) {
        toast({ title: "Error", description: "Could not load menu item details for your cart.", variant: "destructive" });
        return;
    }

    const loadedCartItems: CartItem[] = cartData.map(cartItem => {
        const menuItem = menuItemsData.find(mi => mi.id === cartItem.menu_item_id);
        if (!menuItem) return null;
        return {
            ...menuItem,
            quantity: cartItem.quantity,
        };
    }).filter((item): item is CartItem => item !== null);
      
    dispatch({ type: "SET_CART", payload: loadedCartItems });
  }, [user, supabase, toast]);


  useEffect(() => {
    if(!isUserLoading) {
      fetchCart();
    }
  }, [user, isUserLoading, fetchCart]);


  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
     if (isUserLoading) {
         toast({ title: "Please wait", description: "Connecting to the cafe..." });
        return;
    }

    if (!user || user.is_anonymous) {
        toast({ title: "Please Log In", description: "You need to be logged in to place an order.", variant: "destructive" });
        router.push('/');
        return;
    }

    if (!supabase) {
        toast({ title: "Connection Error", description: "Could not connect to the database. Please refresh.", variant: "destructive" });
        return;
    }
    
    if(state.items.length === 0) {
        toast({ title: "Cart is empty", description: "Add items to your cart before placing an order.", variant: "destructive" });
        return;
    }
    
    const customerName = userProfile?.name || "Guest";

    try {
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                user_name: customerName,
                total_amount: totalPrice,
                status: "Pending",
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const newOrderId = orderData.id;

        const orderItemsToInsert = state.items.map(item => ({
            order_id: newOrderId,
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
        if (itemsError) throw itemsError;

        const { error: clearCartError } = await supabase.from('user_cart_items').delete().eq('user_id', user.id);
        if (clearCartError) throw clearCartError;

        dispatch({type: 'CLEAR_CART' });
        router.push(`/orders/${newOrderId}`);

    } catch(error: any) {
        console.error("Error placing order:", error);
        toast({
            title: "Order Failed",
            description: error.message || "There was an issue placing your order. Please try again.",
            variant: "destructive"
        })
    }
  }


  // --- DB Cart Actions ---
  const addItem = async (item: MenuItem) => {
    if (!user || user.is_anonymous || !supabase) {
      toast({ title: 'Please log in', description: 'You need an account to create a cart.', variant: 'destructive'});
      router.push('/');
      return;
    }

    if (item.stock <= 0) {
      toast({ title: "Out of Stock", description: `${item.name} is currently unavailable.`, variant: "destructive" });
      return;
    }

    const existingItem = state.items.find(i => i.id === item.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity >= item.stock) {
      toast({ title: "Stock limit reached", description: `You cannot add more of ${item.name}.`, variant: "destructive" });
      return;
    }
    
    let error;

    if (existingItem) {
        // Item exists, so update the quantity
        const { error: updateError } = await supabase
            .from('user_cart_items')
            .update({ quantity: currentQuantity + 1 })
            .match({ user_id: user.id, menu_item_id: item.id });
        error = updateError;
    } else {
        // Item doesn't exist, so insert a new row
        const { error: insertError } = await supabase
            .from('user_cart_items')
            .insert({ user_id: user.id, menu_item_id: item.id, quantity: 1 });
        error = insertError;
    }

    if (error) {
      toast({ title: 'Error', description: 'Could not add item to cart.', variant: 'destructive'});
    } else {
      if (existingItem) {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: currentQuantity + 1 }});
      } else {
        dispatch({ type: 'ADD_ITEM', payload: { ...item, quantity: 1 } });
      }
      setAddedItemPopup(item);
      setTimeout(() => setAddedItemPopup(null), 1000);
    }
  };

  const removeItem = async (id: string) => {
    if (!user || user.is_anonymous || !supabase) return;

    const { error } = await supabase
      .from('user_cart_items')
      .delete()
      .match({ user_id: user.id, menu_item_id: id });

    if (error) {
      toast({ title: 'Error', description: 'Could not remove item from cart.', variant: 'destructive' });
    } else {
      dispatch({ type: 'REMOVE_ITEM', payload: { id } });
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!user || user.is_anonymous || !supabase) return;

    const item = state.items.find(i => i.id === id);
    if (item && quantity > item.stock) {
        toast({ title: "Stock limit reached", description: `Only ${item.stock} of ${item.name} available.`, variant: "destructive" });
        return; // Prevent update if stock limit is exceeded
    }

    if (quantity <= 0) {
        await removeItem(id);
        return;
    }

    const { error } = await supabase
        .from('user_cart_items')
        .update({ quantity })
        .match({ user_id: user.id, menu_item_id: id });

    if (error) {
        toast({ title: 'Error', description: 'Could not update item quantity.', variant: 'destructive' });
    } else {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
};

  const clearCart = async () => {
    if (!user || user.is_anonymous || !supabase) return;

    const { error } = await supabase
      .from('user_cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Could not clear your cart.', variant: 'destructive' });
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  };


  return (
    <CartContext.Provider value={{ 
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
        clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

    