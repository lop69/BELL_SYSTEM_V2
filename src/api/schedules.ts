import { supabase } from "@/integrations/supabase/client";
import { ScheduleFormValues } from "@/lib/schemas";
import { ScheduleGroup } from "@/types/database";

export const fetchScheduleGroups = async (): Promise<ScheduleGroup[]> => {
  const { data, error } = await supabase
    .from("schedule_groups")
    .select("*, schedules(*)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ScheduleGroup[]) || [];
};

export const addScheduleGroup = async (values: ScheduleFormValues, userId: string) => {
  const { data, error } = await supabase
    .from("schedule_groups")
    .insert({ name: values.name, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteScheduleGroup = async (groupId: string) => {
  const { error } = await supabase.from("schedule_groups").delete().eq("id", groupId);
  if (error) throw error;
};

export const addSchedule = async (values: ScheduleFormValues, groupId: string, userId: string) => {
  const { data, error } = await supabase
    .from("schedules")
    .insert({ name: values.name, schedule_group_id: groupId, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const setActiveSchedule = async (scheduleId: string, groupId: string) => {
  const { error } = await supabase.rpc('set_active_schedule', {
    target_schedule_id: scheduleId,
    target_group_id: groupId,
  });
  if (error) throw error;
};