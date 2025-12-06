
"use client";

import type { CartItem, MenuItem, Order, OrderItem, UserProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useRouter } from "next/navigation";


type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD_ITEM"; payload: MenuItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_STATE"; payload: CartState };

const getInitialState = (): CartState => {
  if (typeof window !== 'undefined') {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        return JSON.parse(storedCart);
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
  }
  return { items: [] };
};


const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  totalPrice: number;
  placeOrder: () => Promise<void>;
  addedItemPopup: MenuItem | null;
  setAddedItemPopup: (item: MenuItem | null) => void;
}>({
  state: getInitialState(),
  dispatch: () => null,
  totalItems: 0,
  totalPrice: 0,
  placeOrder: async () => {},
  addedItemPopup: null,
  setAddedItemPopup: () => {},
});

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        const newQuantity = newItems[existingItemIndex].quantity + 1;
        if(newQuantity > action.payload.stock) {
            return state;
        }
        newItems[existingItemIndex].quantity = newQuantity;
        return { ...state, items: newItems };
      } else {
        const newItem: CartItem = {
          ...action.payload,
          quantity: 1,
        };
        return { ...state, items: [...state.items, newItem] };
      }
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) => {
          if (item.id === action.payload.id) {
            if(action.payload.quantity > item.stock) {
                return {...item, quantity: item.stock};
            }
            return { ...item, quantity: action.payload.quantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
      return { ...state, items: newItems };
    }
    case "CLEAR_CART":
        return { ...state, items: [] };
    case "SET_STATE":
        return action.payload;
    default:
      return state;
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isInitialized, setIsInitialized] = useState(false);
  const [addedItemPopup, setAddedItemPopup] = useState<MenuItem | null>(null);
  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          dispatch({ type: 'SET_STATE', payload: JSON.parse(storedCart) });
        }
      } catch (error) {
        console.error("Failed to load cart from localStorage", error);
      } finally {
        setIsInitialized(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem('cart', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save cart to localStorage", error);
        }
    }
  }, [state, isInitialized]);


  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    if (isUserLoading) {
         toast({
            title: "Please wait",
            description: "Connecting to the cafe...",
        })
        return;
    }

    if (!user || !supabase) {
        toast({
            title: "Connection Error",
            description: "User not found or could not connect to the database. Please refresh.",
            variant: "destructive"
        })
        return;
    }
    
    if(state.items.length === 0) {
        toast({
            title: "Cart is empty",
            description: "Add items to your cart before placing an order.",
            variant: "destructive"
        })
        return;
    }
    
    let customerName = "Guest";
    if (userProfile?.name) {
        customerName = userProfile.name;
    } else if (user && !user.is_anonymous) {
        // Fallback for registered user if profile is slow to load
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();
        if (profileError) {
             toast({
                title: "Could not find user profile",
                description: "Please try again.",
                variant: "destructive"
            });
            return;
        }
        customerName = profileData.name;
    } else {
        toast({
            title: "Please Log In",
            description: "You need to be logged in to place an order.",
            variant: "destructive"
        });
        router.push('/');
        return;
    }


    try {
        // 1. Insert the order
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

        // 2. Prepare and insert order items
        const orderItemsToInsert = state.items.map(item => ({
            order_id: newOrderId,
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;

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

  return (
    <CartContext.Provider value={{ state, dispatch, totalItems, totalPrice, placeOrder, addedItemPopup, setAddedItemPopup }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  const { toast } = useToast();

  const addItem = (item: MenuItem) => {
    if (item.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${item.name} is currently unavailable.`,
        variant: "destructive",
      });
      return;
    }
    
    const cartItem = context.state.items.find(i => i.id === item.id);
    if (cartItem && cartItem.quantity >= item.stock) {
        toast({
            title: "Stock limit reached",
            description: `You cannot add more of ${item.name}.`,
            variant: "destructive",
        });
        return;
    }

    context.dispatch({ type: "ADD_ITEM", payload: item });
    context.setAddedItemPopup(item);
    setTimeout(() => {
        context.setAddedItemPopup(null);
    }, 1000);
  };
  
  const removeItem = (id: string) => {
    context.dispatch({ type: "REMOVE_ITEM", payload: { id } });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    const item = context.state.items.find(i => i.id === id);
    if(item && quantity > item.stock) {
        toast({
            title: "Stock limit reached",
            description: `Only ${item.stock} of ${item.name} available.`,
            variant: "destructive",
        });
        context.dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity: item.stock } });
        return;
    }
    context.dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  };

  const clearCart = () => {
      context.dispatch({type: "CLEAR_CART"});
  }

  return {
    ...context,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
};
