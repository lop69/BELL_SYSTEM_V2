import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wifi, WifiOff, HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { showError } from "@/utils/toast";

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
      showError("Failed to fetch devices.");
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
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Device Status</h1>
        <p className="text-muted-foreground">Live monitor of your connected hardware.</p>
      </div>

      {devices.length > 0 ? (
        <div className="space-y-4">
          {devices.map((device) => (
            <Card key={device.id} className="glass-card">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {device.is_connected ? (
                    <Wifi className="h-8 w-8 text-green-500 flex-shrink-0" />
                  ) : (
                    <WifiOff className="h-8 w-8 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{device.device_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Schedule: {device.schedules?.name || "Unassigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last seen: {device.last_seen ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card text-center p-8">
          <CardHeader>
            <CardTitle className="flex justify-center items-center gap-3">
              <HardDrive className="h-8 w-8 text-primary" />
              No Devices Found
            </CardTitle>
            <CardDescription className="mt-2">
              To add a device, create it in the Supabase dashboard, then copy its ID into the ESP8266 firmware.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default Devices;