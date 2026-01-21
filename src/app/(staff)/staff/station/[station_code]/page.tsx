
import StationDashboard from '@/components/staff/StationDashboard';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, HardHat } from 'lucide-react';
import { notFound } from 'next/navigation';

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
  const { station_code } = params;
  const station = await getStationByCode(station_code);

  if (!station) {
    notFound();
  }

  return (
    <div className="bg-muted/40 h-screen w-full flex flex-col">
       <StationDashboard station={station} />
    </div>
  );
}
