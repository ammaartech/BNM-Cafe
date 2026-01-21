import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, HardHat, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Station, UserProfile } from '@/lib/types';
import StaffLogoutButton from './StaffLogoutButton';


async function StationSelectionView({ userProfile }: { userProfile: UserProfile | null }) {
   if (!userProfile) {
     return <p>Loading user profile...</p>; // Should not happen due to middleware
   }

   const supabase = createServerComponentClient({ cookies });
   let stations: Station[] = [];
   let error: string | null = null;

   if (userProfile.role === 'admin') {
     const { data, error: fetchError } = await supabase
       .from('stations')
       .select('id, name, code')
       .eq('active', true)
       .order('sort_order', { ascending: true });
     if (fetchError) error = fetchError.message;
     else stations = data || [];
   } else if (userProfile.role === 'staff' && userProfile.station_id) {
     const { data, error: fetchError } = await supabase
       .from('stations')
       .select('id, name, code')
       .eq('id', userProfile.station_id)
       .single();
     if (fetchError) error = fetchError.message;
     else if (data) stations = [data];
   }
   
   const noStationAssigned = userProfile.role === 'staff' && !userProfile.station_id;

   return (
    <>
      <div className="text-center mb-8">
        <Image src="/bnmlogoB.png" alt="B.N.M Cafe Logo" width={120} height={120} priority className="mx-auto mb-4 invert" />
        <h1 className="text-3xl font-bold tracking-tight">Select Your Station</h1>
        <p className="text-muted-foreground">Choose your assigned station to view live orders.</p>
      </div>
      
      {error && <Alert variant="destructive"><AlertTitle>{error}</AlertTitle></Alert>}

      {noStationAssigned ? (
         <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <HardHat className="w-8 h-8 text-destructive" />
                <div>
                    <CardTitle>No Station Assigned</CardTitle>
                    <p className="text-muted-foreground">Please contact an administrator to be assigned to a station.</p>
                </div>
            </CardHeader>
        </Card>
      ) : stations.length > 0 || userProfile?.role === 'admin' ? (
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl">
          {userProfile?.role === 'admin' && (
            <Link href="/staff/admin/kot" className="block w-full sm:w-auto">
              <Card className="h-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg sm:min-w-[200px]">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-semibold">Master KOT</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          )}
          {stations.map((station) => (
            <Link href={`/staff/station/${station.code}`} key={station.id} className="block w-full sm:w-auto">
              <Card className="h-full hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-lg sm:min-w-[200px]">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-semibold">{station.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <HardHat className="w-8 h-8 text-destructive" />
                <div>
                    <CardTitle>No Active Stations</CardTitle>
                    <p className="text-muted-foreground">No station is assigned to your account.</p>
                </div>
            </CardHeader>
        </Card>
      )}
    </>
   );
}


export default async function StationSelectionPage() {
    const supabase = createServerComponentClient({ cookies });
    
    // Middleware ensures we have a user, so we can safely assume user is not null.
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the user's profile to determine their role and station.
    const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single<UserProfile>();
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="p-3 bg-card border-b shadow-sm flex justify-between items-center flex-shrink-0">
                <h1 className="text-xl font-bold tracking-tight">BNM Cafe Staff</h1>
                <StaffLogoutButton />
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <StationSelectionView userProfile={userProfile} />
            </main>
        </div>
    );
}
