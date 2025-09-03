import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

/**
 * Logs a user action to the audit_log table.
 * This is a fire-and-forget operation and won't block the UI.
 * @param user The authenticated user object.
 * @param action A machine-readable key for the action (e.g., 'CREATE_SCHEDULE').
 * @param details Contextual JSON data about the action.
 */
export const logUserAction = async (
  user: User | null,
  action: string,
  details: Record<string, any> = {}
) => {
  if (!user) {
    console.error("Log Action Error: Cannot log action for unauthenticated user.");
    return;
  }

  try {
    const { error } = await supabase.from("audit_log").insert({
      user_id: user.id,
      action,
      details,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    // We don't show this error to the user as it's a background task.
    console.error("Failed to log user action:", action, error);
  }
};