import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wifi, WifiOff, HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Device {
  id: string;
  device_name: string;
  is_connected: boolean;
  last_seen: string;
  schedules: { name: string } | null;
}

const Devices = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("devices")
      .select("*, schedules(name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to fetch devices.");
    } else {
      setDevices((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('realtime-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Device Status</h1><p className="text-muted-foreground">Checking your connected hardware.</p></div>
        <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Device Status</h1><p className="text-muted-foreground">A live look at your connected hardware.</p></div>

      {devices.length > 0 ? (
        <div className="space-y-4">
          {devices.map((device) => (
            <Card key={device.id} className="glass-card">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {device.is_connected ? <Wifi className="h-8 w-8 text-green-500" /> : <WifiOff className="h-8 w-8 text-red-500" />}
                  <div>
                    <p className="font-semibold">{device.device_name}</p>
                    <p className="text-sm text-muted-foreground">Schedule: {device.schedules?.name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">Last seen: {device.last_seen ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) : "Never"}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${device.is_connected ? 'bg-green-500' : 'bg-red-500'}`} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card text-center p-8"><CardHeader><CardTitle className="flex justify-center items-center gap-3"><HardDrive className="h-8 w-8 text-primary" />No Devices Found</CardTitle><CardDescription>Your devices will appear here once they are online.</CardDescription></CardHeader></Card>
      )}
    </div>
  );
};

export default Devices;