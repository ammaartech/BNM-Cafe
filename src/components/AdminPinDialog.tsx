'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

const ADMIN_PIN = 'admin123';

interface AdminPinDialogProps {
  isOpen: boolean;
  onPinVerified: (isVerified: boolean) => void;
}

export function AdminPinDialog({ isOpen, onPinVerified }: AdminPinDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleVerify = () => {
    if (pin === ADMIN_PIN) {
      setError(null);
      onPinVerified(true);
    } else {
      setError('Invalid PIN. Please try again.');
      onPinVerified(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
    if (error) {
      setError(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onPinVerified(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Admin Access</DialogTitle>
          <DialogDescription>
            Enter the PIN code to view the admin dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {error && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="PIN Code"
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleVerify}>
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
