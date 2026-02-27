"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsAndConditionsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-24">
            <div className="sticky top-0 bg-[#f8f9fa]/90 backdrop-blur-md z-10 px-4 py-4 sm:px-6 shadow-sm border-b">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-black/5">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight text-[#1a1c1e] flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#154b23]" />
                        Terms of Service
                    </h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-slate max-w-none">
                    <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">1. Introduction</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        Welcome to BNM Cafe. By accessing and using our application, you agree to comply with and be bound by the following Terms and Conditions. Please review these terms carefully. If you do not agree with these terms, you should not use this application.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">2. Application Use</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        The BNM Cafe app is intended for users to view menus, place food and beverage orders, and make payments for items prepared at our various campus stations (North Indian, South Indian, Refreshments, and Chats). You agree to use the app only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the app.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">3. Orders and Payments</h2>
                    <ul className="list-disc pl-5 mb-6 text-gray-700 leading-relaxed space-y-2">
                        <li>All orders are subject to availability. Items may become unavailable after an order is placed, in which case a refund or alternative will be offered.</li>
                        <li>Prices are subject to change without notice. The price charged will be the price in effect at the time the order is placed.</li>
                        <li>Payments are processed securely through our designated gateway. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the app.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">4. Order Fulfillment and Pickup</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        Once an order is marked as "Ready for Pickup", it is the customer's responsibility to collect it from the designated station promptly. Uncollected orders will not be refunded. Wait times are approximate and may vary during peak hours.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">5. User Accounts</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        To use certain features of the app, you may be required to register for an account. You are responsible for maintaining the confidentiality of your account information. We reserve the right to terminate accounts, remove or edit content, or cancel orders in our sole discretion.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">6. Limitation of Liability</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        BNM Cafe shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, good-will, or other intangible losses.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">7. Changes to Terms</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        We reserve the right to modify these terms at any time. Your continued use of the application following any changes indicates your acceptance of the new terms.
                    </p>
                </div>
            </div>
        </div>
    );
}
