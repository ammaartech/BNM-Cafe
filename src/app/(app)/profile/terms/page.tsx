
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsAndConditionsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Terms and Conditions</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">1. Acceptance of Terms</h2>
            <p>
              By downloading, browsing, accessing, or using this B.N.M Cafe mobile application, you agree to be bound by these Terms and Conditions. We reserve the right to amend these terms at any time.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">2. Account Registration</h2>
            <p>
              You must be a student, faculty member, or staff at the university to create an account. You are responsible for maintaining the confidentiality of your login details and for all activities that occur under your account.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">3. Orders and Payment</h2>
            <p>
              All orders placed through the app are subject to availability. We accept various forms of digital payment as indicated in the app. All prices are listed in INR and are inclusive of applicable taxes.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">4. Cancellations and Refunds</h2>
            <p>
              Orders may be cancelled within a specified timeframe after placement. Refund policies for cancelled or incorrect orders will be handled on a case-by-case basis. Please contact cafe staff for assistance.
            </p>
          </div>
           <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">5. User Conduct</h2>
            <p>
              You agree to use the app only for lawful purposes. You must not use the app in any way that causes, or may cause, damage to the app or impairment of the availability or accessibility of the app.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">6. Limitation of Liability</h2>
            <p>
              The application is provided "as is." We will not be liable for any direct, indirect, special, or consequential damages arising out of the use or inability to use this app.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
