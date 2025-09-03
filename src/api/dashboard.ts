import { supabase } from "@/integrations/supabase/client";

export const fetchDashboardData = async (userId: string) => {
  const todayIndex = new Date().getDay();
  const { data, error } = await supabase.rpc('get_dashboard_data', {
    p_user_id: userId,
    p_day_of_week: todayIndex
  });
  if (error) throw new Error(error.message);
  return data || [];
};