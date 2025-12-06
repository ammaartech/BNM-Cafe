
"use client";

import type { CartItem, MenuItem, Order, OrderItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";


type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD_ITEM"; payload: MenuItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" };

const initialState: CartState = {
  items: [],
};

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  totalPrice: number;
  placeOrder: () => Promise<void>;
  addedItemPopup: MenuItem | null;
  setAddedItemPopup: (item: MenuItem | null) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
}>({
  state: initialState,
  dispatch: () => null,
  totalItems: 0,
  totalPrice: 0,
  placeOrder: async () => {},
  addedItemPopup: null,
  setAddedItemPopup: () => {},
  customerName: "",
  setCustomerName: () => {},
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
    default:
      return state;
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [addedItemPopup, setAddedItemPopup] = useState<MenuItem | null>(null);
  const [customerName, setCustomerName] = useState("");
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();


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

    if (!user) {
        toast({
            title: "Not signed in",
            description: "Anonymous user not found. Please refresh.",
             variant: "destructive"
        })
        return;
    }

    if (!firestore) {
        toast({
            title: "Connection Error",
            description: "Could not connect to the database.",
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

     if (!customerName.trim()) {
        toast({
            title: "Name is required",
            description: "Please enter a name for the order in your cart.",
            variant: "destructive"
        });
        router.push('/cart');
        return;
    }

    try {

        const orderItems: OrderItem[] = state.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        const newOrderRef = doc(collection(firestore, 'users', user.uid, 'orders'));

        const newOrder: Order = {
            id: newOrderRef.id,
            userId: user.uid,
            userName: customerName.trim(),
            orderDate: new Date().toISOString(),
            totalAmount: totalPrice,
            status: "Pending",
            items: orderItems,
        }

        await setDoc(newOrderRef, newOrder);

        dispatch({type: 'CLEAR_CART' });
        setCustomerName(""); // Clear name after order
        router.push(`/orders/${newOrderRef.id}`);

    } catch(error) {
        console.error("Error placing order:", error);
        toast({
            title: "Order Failed",
            description: "There was an issue placing your order. Please try again.",
            variant: "destructive"
        })
    }
  }

  return (
    <CartContext.Provider value={{ state, dispatch, totalItems, totalPrice, placeOrder, addedItemPopup, setAddedItemPopup, customerName, setCustomerName }}>
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
