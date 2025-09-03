import { supabase } from "@/integrations/supabase/client";

export const fetchDevices = async () => {
  const { data, error } = await supabase
    .from("devices")
    .select("*, schedule_groups(schedules(name, is_active))");
  if (error) throw new Error(error.message);
  return data || [];
};