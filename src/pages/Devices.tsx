import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wifi, WifiOff, HardDrive, ServerCrash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface Device {
  id: string;
  device_name: string;
  is_connected: boolean;
  last_seen: string;
  schedules: { name: string } | null;
}

export const fetchDevices = async () => {
  const { data, error } = await supabase
    .from("devices")
    .select("*, schedules(name)");
  if (error) throw new Error(error.message);
  return (data as any[]) || [];
};

const Devices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, isError } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['devices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Device Status</h1>
          <p className="text-muted-foreground">Live monitor of your connected hardware.</p>
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Device Status</h1>
          <p className="text-muted-foreground">Live monitor of your connected hardware.</p>
        </div>
        <Card className="glass-card text-center p-8">
          <CardHeader>
            <CardTitle className="flex justify-center items-center gap-3">
              <ServerCrash className="h-8 w-8 text-destructive" />
              Failed to Load Devices
            </CardTitle>
            <CardDescription className="mt-2">
              There was a problem fetching your device data. Please check your connection and try again.
            </CardDescription>
          </CardHeader>
        </Card>
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
          <AnimatePresence>
            {devices.map((device) => (
              <motion.div
                key={device.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Card className="glass-card">
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
              </motion.div>
            ))}
          </AnimatePresence>
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