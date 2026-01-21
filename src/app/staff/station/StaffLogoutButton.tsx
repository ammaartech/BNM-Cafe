'use client';

import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase/provider";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StaffLogoutButton() {
    const { supabase } = useSupabase();
    const router = useRouter();

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push('/staff/login'); // Redirect to the staff login page after logout
    };

    return (
        <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
    )
}
