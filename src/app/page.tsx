
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is the root page of the application.
// It now serves as a simple entry point that redirects to the appropriate starting page.
// The actual authentication and routing logic is handled by the SupabaseProvider.
export default function RootPage() {
  const router = useRouter();
  
  // The SupabaseProvider will handle redirecting to /login or /menu based on auth state.
  // This is a fallback in case the provider logic hasn't kicked in yet.
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
