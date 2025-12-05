
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4 text-sm text-muted-foreground">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">1. Introduction</h2>
            <p>
              B.N.M Cafe ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">2. Information We Collect</h2>
            <p>
              We may collect personal information that you provide to us, such as your name, email address, and order details. We also collect your order history and favorite items to enhance your experience.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">3. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Process your transactions and fulfill your orders.</li>
              <li>Create and manage your account.</li>
              <li>Personalize your experience by showing you relevant items.</li>
              <li>Communicate with you about your orders or account.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">4. Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
            </p>
          </div>
           <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can manage your profile information directly within the app or by contacting us.
            </p>
          </div>
           <div className="space-y-2">
            <h2 className="font-semibold text-lg text-foreground">6. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at the B.N.M Cafe front desk.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
