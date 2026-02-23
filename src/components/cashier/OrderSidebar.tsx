"use client";

import { useState } from "react";
import { useCashier } from "@/context/CashierContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, Printer, CreditCard, Loader2 } from "lucide-react";
import { PaymentDialog } from "./PaymentDialog";

export function OrderSidebar() {
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

    const {
        state,
        updateQuantity,
        removeFromBill,
        setCustomerName,
        placePendingOrder,
        clearBill,
        totalPrice,
        totalItems,
        isPlacingOrder
    } = useCashier();

    const handlePrint = () => {
        window.print();
    };

    const handlePlaceOrderClick = async () => {
        const orderData = await placePendingOrder();
        if (orderData && orderData.id) {
            setPendingOrderId(orderData.id);
            setIsPaymentDialogOpen(true);
        }
    };

    const handlePaymentConfirmed = async () => {
        // Automatically close dialog and clear bill
        setIsPaymentDialogOpen(false);
        clearBill();
        setPendingOrderId(null);
    };

    return (
        <div className="flex flex-col h-full bg-muted/30 border-l">
            <div className="p-4 border-b bg-background">
                <h2 className="text-xl font-bold mb-4">Current Order</h2>
                <Input
                    placeholder="Customer Name (Optional)"
                    value={state.customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-muted/50"
                />
            </div>

            <ScrollArea className="flex-grow p-4">
                {state.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                        <p>No items added</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {state.items.map((item) => (
                            <div key={item.id} className="flex gap-2">
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm">{item.name}</span>
                                        <span className="font-bold text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 rounded-full"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 rounded-full"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto"
                                            onClick={() => removeFromBill(item.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 bg-background border-t space-y-4">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Items</span>
                        <span>{totalItems}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={clearBill} disabled={state.items.length === 0}>
                        Clear
                    </Button>
                    <Button variant="secondary" onClick={handlePrint} disabled={state.items.length === 0}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>

                <Button
                    className="w-full h-12 text-lg"
                    onClick={handlePlaceOrderClick}
                    disabled={state.items.length === 0 || isPlacingOrder}
                >
                    {isPlacingOrder ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                    Place Order & Pay
                </Button>
            </div>

            <PaymentDialog
                orderId={pendingOrderId}
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                onPaymentConfirmed={handlePaymentConfirmed}
            />
        </div>
    );
}
