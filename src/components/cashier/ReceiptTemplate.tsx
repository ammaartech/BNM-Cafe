"use client";

import { useCashier } from "@/context/CashierContext";
import { format } from "date-fns";

export function ReceiptTemplate() {
    const { state, totalPrice } = useCashier();
    const date = new Date();

    return (
        <div className="hidden print:block absolute top-0 left-0 w-full h-full bg-white z-50 p-8">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">BNM Cafe</h1>
                <p className="text-sm text-gray-500">Fast & Fresh</p>
                <p className="text-xs text-gray-400 mt-1">{format(date, "PPP p")}</p>
            </div>

            <div className="mb-6 border-b pb-4 border-dashed border-gray-300">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-bold">{state.customerName || "Walk-in"}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Type:</span>
                    <span className="font-bold">Dine-in / Takeaway</span>
                </div>
            </div>

            <table className="w-full text-sm text-left mb-6">
                <thead>
                    <tr className="border-b border-gray-300">
                        <th className="py-2 font-semibold">Item</th>
                        <th className="py-2 font-semibold text-center">Qty</th>
                        <th className="py-2 font-semibold text-right">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {state.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2">{item.name}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-8 pt-2">
                <div className="text-right">
                    <div className="text-2xl font-bold">Total: ₹{totalPrice.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        (Inclusive of all taxes)
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-400 mt-12">
                <p>Thank you for visiting!</p>
                <p className="mt-1">Please retain this bill for your reference.</p>
            </div>
        </div>
    );
}
