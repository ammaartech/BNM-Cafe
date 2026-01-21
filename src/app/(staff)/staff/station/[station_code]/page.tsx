import StationDashboard from '@/components/staff/StationDashboard';
import { AlertTriangle } from 'lucide-react';
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

export default async function StationDashboardPage({ params }: StationPageProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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

  // Fetch user profile AND station data in parallel for efficiency
  const [
    { data: userProfile },
    { data: station, error: stationError }
  ] = await Promise.all([
    supabase.from('users').select('role, station_id').eq('id', user.id).single(),
    supabase.from('stations').select('id, name, code').eq('code', params.station_code).single()
  ]);

  if (stationError || !station) {
    notFound();
  }

  if (!userProfile) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
             <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>Could not verify your user profile.</AlertDescription>
            </Alert>
        </div>
    )
  }

  const isAdmin = userProfile.role === 'admin';
  const isStaffForThisStation = userProfile.role === 'staff' && userProfile.station_id === station.id;

  // Explicitly deny access if the user is NOT an admin AND NOT the correct staff member.
  if (!isAdmin && !isStaffForThisStation) {
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
