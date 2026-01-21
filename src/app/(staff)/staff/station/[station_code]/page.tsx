
import StationDashboard from '@/components/staff/StationDashboard';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, HardHat, Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const revalidate = 0;

type StationPageProps = {
  params: {
    station_code: string;
  };
};

async function getStationByCode(code: string) {
    const { data, error } = await supabase
        .from('stations')
        .select('id, name, code')
        .eq('code', code)
        .single();
    
    if (error || !data) {
        console.warn(`Station with code "${code}" not found.`);
        return null;
    }
    return data;
}

export default async function StationDashboardPage({ params }: StationPageProps) {
  const supabaseAuth = createServerComponentClient({ cookies });
  const { data: { user } } = await supabaseAuth.auth.getUser();

  const { data: userProfile } = await supabase
    .from('users')
    .select('role, station_id')
    .eq('id', user?.id)
    .single();

  const { station_code } = params;
  const station = await getStationByCode(station_code);

  if (!station) {
    notFound();
  }

  // Auth Guard
  if (!user || !userProfile) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
             <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You must be logged in to view this page.</AlertDescription>
            </Alert>
        </div>
    )
  }

  const isStaffForThisStation = userProfile.role === 'staff' && userProfile.station_id === station.id;
  const isAdmin = userProfile.role === 'admin';

  if (userProfile.role === 'customer' || (userProfile.role === 'staff' && !isStaffForThisStation)) {
     return (
        <div className="flex h-screen w-full items-center justify-center p-4">
             <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You do not have permission to view this station's dashboard.</AlertDescription>
            </Alert>
        </div>
    )
  }


  return (
    <div className="bg-background h-screen w-full flex flex-col">
       <StationDashboard station={station} />
    </div>
  );
}
