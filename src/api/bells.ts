import { supabase } from "@/integrations/supabase/client";
import { BellFormValues } from "@/lib/schemas";
import { Bell } from "@/types/database";

export const fetchBellsForSchedule = async (scheduleId: string) => {
  const { data, error } = await supabase.from("bells").select("*").eq("schedule_id", scheduleId).order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const manageBell = async (values: BellFormValues, userId: string, bell?: Bell) => {
  const bellData = { ...values, user_id: userId };
  const { data, error } = bell
    ? await supabase.from("bells").update(bellData).eq("id", bell.id).select().single()
    : await supabase.from("bells").insert(bellData).select().single();
  if (error) throw error;
  return data;
};

export const deleteBell = async (bellId: string) => {
  const { error } = await supabase.from("bells").delete().eq("id", bellId);
  if (error) throw error;
};