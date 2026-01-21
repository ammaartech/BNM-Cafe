import StationDashboard from '@/components/staff/StationDashboard';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Station } from '@/lib/types';

export const revalidate = 0;

type StationPageProps = {
  params: {
    station_code: string;
  };
};

export default async function StationDashboardPage({ params }: StationPageProps) {
  const supabase = createServerComponentClient({ cookies });
  
  // Middleware has already verified that the user is authenticated and authorized to see this page.
  // We just need to fetch the station data to render the dashboard.
  const { data: station, error: stationError } = await supabase
    .from('stations')
    .select('id, name, code')
    .eq('code', params.station_code)
    .single<Station>();

  if (stationError || !station) {
    notFound();
  }

  return (
    <div className="bg-background h-screen w-full flex flex-col">
       <StationDashboard station={station} />
    </div>
  );
}
