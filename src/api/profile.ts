import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone_number, role, department, push_notifications_enabled, email_summary_enabled")
    .eq("id", userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  return data;
};

export const updateProfile = async (userId: string, newProfileData: Partial<Profile>) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(newProfileData)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};