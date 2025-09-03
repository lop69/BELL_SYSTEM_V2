import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDevices } from "@/api/devices";

export const useDevices = () => {
  const queryClient = useQueryClient();

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

  return useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 1000 * 60 * 5,
  });
};