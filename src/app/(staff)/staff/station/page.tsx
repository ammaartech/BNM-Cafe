
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { HardHat } from "lucide-react";
import Image from "next/image";

// Fetch stations on the server
async function getStations() {
  const { data: stations, error } = await supabase
    .from("stations")
    .select("id, name, code")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching stations:", error);
    return [];
  }
  return stations;
}

export default async function StationSelectionPage() {
  const stations = await getStations();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center mb-8">
        <Image src="/bnmlogoB.png" alt="B.N.M Cafe Logo" width={120} height={120} priority className="mx-auto mb-4 invert" />
        <h1 className="text-3xl font-bold tracking-tight">Select Your Station</h1>
        <p className="text-muted-foreground">Choose your assigned station to view live orders.</p>
      </div>
      
      {stations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          {stations.map((station) => (
            <Link href={`/staff/station/${station.code}`} key={station.id} className="block">
              <Card className="h-full hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-center font-semibold">{station.name}</CardTitle>
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
                    <p className="text-muted-foreground">Please contact an administrator to set up kitchen stations.</p>
                </div>
            </CardHeader>
        </Card>
      )}
    </div>
  );
}
