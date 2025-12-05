"use client";

import type { CartItem, MenuItem, Order, OrderItem, UserProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { addDocumentNonBlocking } from "@/firebase";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
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
}>({
  state: initialState,
  dispatch: () => null,
  totalItems: 0,
  totalPrice: 0,
  placeOrder: async () => {},
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
            // Can't add more than stock. We could show a toast here but it's handled in the component.
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
                // Prevent updating quantity beyond stock
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
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    if (!user || !firestore) {
        toast({
            title: "Not signed in",
            description: "Please log in to place an order.",
            variant: "destructive"
        })
        router.push('/login');
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

    try {
        const userProfileRef = doc(firestore, "users", user.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        const userProfile = userProfileSnap.data() as UserProfile;

        const orderItems: OrderItem[] = state.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        const newOrder: Omit<Order, 'id'> = {
            userId: user.uid,
            userName: userProfile?.name || user.email || 'Unknown User',
            orderDate: new Date().toISOString(),
            totalAmount: totalPrice,
            status: "Pending",
            items: orderItems,
        }

        const ordersCollectionRef = collection(firestore, 'users', user.uid, 'orders');
        await addDocumentNonBlocking(ordersCollectionRef, newOrder);

        dispatch({type: 'CLEAR_CART' });

        toast({
            title: "Order Placed!",
            description: "Your order has been successfully placed.",
        });

        router.push('/orders');

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
    <CartContext.Provider value={{ state, dispatch, totalItems, totalPrice, placeOrder }}>
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
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
      duration: 1000,
    });
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
