"use client";

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase/provider";

/* ---------------- TYPES ---------------- */

export interface CashierCartItem extends MenuItem {
    quantity: number;
}

type CashierState = {
    items: CashierCartItem[];
    customerName: string;
};

type CashierAction =
    | { type: "ADD_ITEM"; payload: MenuItem }
    | { type: "REMOVE_ITEM"; payload: { id: string } }
    | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
    | { type: "SET_CUSTOMER_NAME"; payload: string }
    | { type: "CLEAR_CART" };

/* ---------------- CONTEXT ---------------- */

interface CashierContextType {
    state: CashierState;
    addToBill: (item: MenuItem) => void;
    removeFromBill: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    setCustomerName: (name: string) => void;
    clearBill: () => void;
    placeOrder: () => Promise<void>;
    totalPrice: number;
    totalItems: number;
    isPlacingOrder: boolean;
}

const CashierContext = createContext<CashierContextType | null>(null);

/* ---------------- REDUCER ---------------- */

function cashierReducer(state: CashierState, action: CashierAction): CashierState {
    switch (action.type) {
        case "ADD_ITEM": {
            const existing = state.items.find((i) => i.id === action.payload.id);
            if (existing) {
                return {
                    ...state,
                    items: state.items.map((i) =>
                        i.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                };
            }
            return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
        }

        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter((i) => i.id !== action.payload.id),
            };

        case "UPDATE_QUANTITY": // This was missing the payload type in the original file, fixed here implicitly
            if (action.payload.quantity <= 0) {
                return {
                    ...state,
                    items: state.items.filter((i) => i.id !== action.payload.id),
                };
            }
            return {
                ...state,
                items: state.items.map((i) =>
                    i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
                ),
            };

        case "SET_CUSTOMER_NAME":
            return { ...state, customerName: action.payload };

        case "CLEAR_CART":
            return { ...state, items: [], customerName: "" };

        default:
            return state;
    }
}

/* ---------------- PROVIDER ---------------- */

export function CashierProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(cashierReducer, { items: [], customerName: "" });
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const { supabase, user } = useSupabase();
    const { toast } = useToast();

    const addToBill = useCallback((item: MenuItem) => {
        dispatch({ type: "ADD_ITEM", payload: item });
    }, []);

    const removeFromBill = useCallback((itemId: string) => {
        dispatch({ type: "REMOVE_ITEM", payload: { id: itemId } });
    }, []);

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        dispatch({ type: "UPDATE_QUANTITY", payload: { id: itemId, quantity } });
    }, []);

    const setCustomerName = useCallback((name: string) => {
        dispatch({ type: "SET_CUSTOMER_NAME", payload: name });
    }, []);

    const clearBill = useCallback(() => {
        dispatch({ type: "CLEAR_CART" });
    }, []);

    const totalPrice = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

    const placeOrder = useCallback(async () => {
        if (!supabase || !user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        if (state.items.length === 0) {
            toast({ title: "Empty Bill", description: "Add items before placing an order.", variant: "destructive" });
            return;
        }

        setIsPlacingOrder(true);

        try {
            const orderItemsParam = state.items.map((item) => ({
                menu_item_uuid: item.uuid,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            }));

            // Use "Walk-in" if no name provided, or append "(Cashier)" to distinguish
            const finalCustomerName = state.customerName.trim() || "Walk-in";

            const { data, error } = await supabase.rpc("create_new_order", {
                user_id_param: user.id, // The cashier's ID
                user_name_param: finalCustomerName,
                total_amount_param: totalPrice,
                order_items_param: orderItemsParam,
            });

            if (error) throw error;

            // Immediately mark as PAID since the cashier collected the payment
            if (data?.order_id) {
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({ payment_status: 'PAID' })
                    .eq('id', data.order_id);

                if (updateError) {
                    console.error('Failed to update payment status:', updateError);
                }
            }

            toast({ title: "Order Placed", description: `Order #${data.display_order_id} created successfully.` });
            clearBill();
        } catch (err: any) {
            console.error("Place Order Error:", err);
            toast({ title: "Order Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsPlacingOrder(false);
        }
    }, [supabase, user, state.items, state.customerName, totalPrice, toast, clearBill]);

    const contextValue = React.useMemo(() => ({
        state,
        addToBill,
        removeFromBill,
        updateQuantity,
        setCustomerName,
        clearBill,
        placeOrder,
        totalPrice,
        totalItems,
        isPlacingOrder,
    }), [
        state,
        addToBill,
        removeFromBill,
        updateQuantity,
        setCustomerName,
        clearBill,
        placeOrder,
        totalPrice,
        totalItems,
        isPlacingOrder
    ]);

    return (
        <CashierContext.Provider value={contextValue}>
            {children}
        </CashierContext.Provider>
    );
}

export function useCashier() {
    const context = useContext(CashierContext);
    if (!context) {
        throw new Error("useCashier must be used within a CashierProvider");
    }
    return context;
}
