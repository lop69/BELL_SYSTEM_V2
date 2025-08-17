/// <reference types="https://deno.land/x/supa_fly/types.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { schedule_id } = await req.json();

    if (!schedule_id) {
      return new Response(JSON.stringify({ error: "Schedule ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First, get the schedule to find the owner (user_id)
    const { data: schedule, error: scheduleError } = await supabaseClient
      .from("schedules")
      .select("id, name, user_id")
      .eq("id", schedule_id)
      .single();

    if (scheduleError || !schedule) {
      console.error("Error fetching schedule:", scheduleError);
      throw new Error("Failed to fetch schedule or schedule not found");
    }

    const user_id = schedule.user_id;

    // Fetch bells for the specific schedule
    const { data: bells, error: bellsError } = await supabaseClient
      .from("bells")
      .select("time, label, days_of_week")
      .eq("schedule_id", schedule_id)
      .order("time", { ascending: true });

    if (bellsError) {
      console.error("Error fetching bells:", bellsError);
      throw new Error("Failed to fetch bells");
    }

    // Check test bell status for the user who owns the schedule
    const { data: testBell, error: testBellError } = await supabaseClient
      .from("test_bells")
      .select("is_active")
      .eq("user_id", user_id)
      .single();

    if (testBellError && testBellError.code !== 'PGRST116') { // Ignore "no rows found"
      console.error("Error fetching test bell status:", testBellError);
      throw new Error("Failed to fetch test bell status");
    }

    return new Response(
      JSON.stringify({
        schedule_name: schedule.name,
        bells,
        test_bell_active: testBell?.is_active || false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Edge Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});