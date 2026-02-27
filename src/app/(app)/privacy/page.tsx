"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-24">
            <div className="sticky top-0 bg-[#f8f9fa]/90 backdrop-blur-md z-10 px-4 py-4 sm:px-6 shadow-sm border-b">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-black/5">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight text-[#1a1c1e] flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#154b23]" />
                        Privacy Policy
                    </h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-slate max-w-none">
                    <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">1. Information We Collect</h2>
                    <p className="mb-4 text-gray-700 leading-relaxed">
                        At BNM Cafe, we collect information that helps us provide and improve our services to you:
                    </p>
                    <ul className="list-disc pl-5 mb-6 text-gray-700 leading-relaxed space-y-2">
                        <li><strong>Personal Information:</strong> Name, email address, and phone number when you register or submit feedback.</li>
                        <li><strong>Transaction Data:</strong> Details about payments (processed securely via third-party providers) and your order history.</li>
                        <li><strong>Usage Data:</strong> Information about how you interact with our application.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">2. How We Use Your Information</h2>
                    <p className="mb-4 text-gray-700 leading-relaxed">
                        We use the collected information for various purposes, including:
                    </p>
                    <ul className="list-disc pl-5 mb-6 text-gray-700 leading-relaxed space-y-2">
                        <li>To process your orders and notify you of order statuses (e.g., "Ready for Pickup").</li>
                        <li>To manage your account and provide customer support.</li>
                        <li>To improve our app design, menu offerings, and cafe operations based on submitted feedback.</li>
                        <li>To communicate with you regarding updates, promotions, or issues with your order.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">3. Data Security</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        We take the security of your data seriously. We use industry-standard security measures, including authentication and secure database implementations (via Supabase), to protect your personal information from unauthorized access, alteration, or disclosure.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">4. Sharing Your Information</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information with our business partners and trusted affiliates for the purposes outlined above. Payment details are shared only with our secure payment processing partners (e.g., Razorpay) to facilitate transactions.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">5. Your Data Rights</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        You have the right to access, update, or delete your personal information. You can review and update your profile information within the app, or you can contact us directly to request data deletion.
                    </p>

                    <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4">6. Contact Us</h2>
                    <p className="mb-6 text-gray-700 leading-relaxed">
                        If you have any questions about this Privacy Policy, the practices of this app, or your dealings with this site, please contact us or submit feedback via the app.
                    </p>
                </div>
            </div>
        </div>
    );
}
