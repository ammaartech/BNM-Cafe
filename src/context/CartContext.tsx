
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
  updatingItemId: string | null;
  fetchCart: (userId: string) => Promise<void>;
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
  updatingItemId: null,
  fetchCart: async () => {},
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
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  const fetchCart = useCallback(async (currentUserId: string) => {
    if (!supabase) {
      return;
    }
    const { data: cartData, error: cartError } = await supabase
      .from('user_cart_items')
      .select('menu_item_id, quantity')
      .eq('user_id', currentUserId);

    if (cartError) {
      console.error("Error fetching cart:", cartError);
      toast({ title: "Error", description: "Could not load your cart.", variant: "destructive" });
      dispatch({ type: "SET_CART", payload: [] });
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
        console.error("Error fetching menu items for cart:", menuItemsError);
        toast({ title: "Error", description: "Could not load menu item details for your cart.", variant: "destructive" });
        dispatch({ type: "SET_CART", payload: [] });
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
  }, [supabase, toast]);


  useEffect(() => {
    if(!isUserLoading && user) {
      fetchCart(user.id);
    } else if (!isUserLoading && !user) {
      dispatch({ type: "SET_CART", payload: [] });
    }
  }, [user, isUserLoading, fetchCart]);


  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    if (isUserLoading) {
        toast({ title: "Please wait", description: "Verifying user session..." });
        return;
    }

    if (!user || user.is_anonymous) {
        toast({ title: "Please Log In", description: "You need to create an account to place an order.", variant: "destructive" });
        router.push('/');
        return;
    }
    
    if(state.items.length === 0) {
        toast({ title: "Cart is empty", description: "Add items to your cart before placing an order.", variant: "destructive" });
        return;
    }
    
    const customerName = userProfile?.name || user.email;
    if (!customerName) {
      toast({ title: "Error", description: "Could not determine user name for the order.", variant: "destructive" });
      return;
    }

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


  const addItem = async (item: MenuItem) => {
    if (!user || !supabase) {
      toast({ title: 'Session error', description: 'Your session could not be verified. Please refresh.', variant: 'destructive'});
      return;
    }

    if (item.stock <= 0) {
      toast({ title: "Out of Stock", description: `${item.name} is currently unavailable.`, variant: "destructive" });
      return;
    }

    setUpdatingItemId(item.id);
    const existingItem = state.items.find(i => i.id === item.id);
    
    if (existingItem) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: existingItem.quantity + 1 }});
    } else {
      dispatch({ type: 'ADD_ITEM', payload: { ...item, quantity: 1 } });
    }

    const { error } = await supabase
      .from('user_cart_items')
      .upsert(
        { user_id: user.id, menu_item_id: item.id, quantity: (existingItem?.quantity || 0) + 1 },
        { onConflict: 'user_id,menu_item_id' }
      );

    if (error) {
      toast({ title: 'Error', description: 'Could not add item to cart.', variant: 'destructive'});
      if (existingItem) {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: existingItem.quantity }});
      } else {
        dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } });
      }
    } else {
      setAddedItemPopup(item);
    }
    setUpdatingItemId(null);
  };

  const removeItem = async (id: string) => {
    if (!user || !supabase) return;

    setUpdatingItemId(id);
    const existingItem = state.items.find(i => i.id === id);
    if (!existingItem) {
        setUpdatingItemId(null);
        return;
    }

    dispatch({ type: 'REMOVE_ITEM', payload: { id } });

    const { error } = await supabase
      .from('user_cart_items')
      .delete()
      .match({ user_id: user.id, menu_item_id: id });

    if (error) {
      toast({ title: 'Error', description: 'Could not remove item from cart.', variant: 'destructive' });
      dispatch({ type: 'ADD_ITEM', payload: existingItem });
    }
    setUpdatingItemId(null);
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!user || !supabase) return;
    
    setUpdatingItemId(id);
    const item = state.items.find(i => i.id === id);
    if (!item) {
        setUpdatingItemId(null);
        return;
    };

    const originalQuantity = item.quantity;

    if (quantity > item.stock) {
        toast({ title: "Stock limit reached", description: `Only ${item.stock} of ${item.name} available.`, variant: "destructive" });
        setUpdatingItemId(null);
        return;
    }
    
    if (quantity <= 0) {
        dispatch({ type: 'REMOVE_ITEM', payload: { id }});
    } else {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity }});
    }

    let error;
    if (quantity <= 0) {
        const { error: deleteError } = await supabase
            .from('user_cart_items')
            .delete()
            .match({ user_id: user.id, menu_item_id: id });
        error = deleteError;
    } else {
        const { error: updateError } = await supabase
            .from('user_cart_items')
            .update({ quantity })
            .match({ user_id: user.id, menu_item_id: id });
        error = updateError;
    }

    if (error) {
        toast({ title: 'Error', description: 'Could not update item quantity.', variant: 'destructive' });
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: originalQuantity }});
    }
    setUpdatingItemId(null);
  };

  const clearCart = async () => {
    if (!user || !supabase) return;

    const currentItems = state.items;
    dispatch({ type: 'CLEAR_CART' });

    const { error } = await supabase
      .from('user_cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Could not clear your cart.', variant: 'destructive' });
      dispatch({ type: 'SET_CART', payload: currentItems });
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
        clearCart,
        updatingItemId,
        fetchCart
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
