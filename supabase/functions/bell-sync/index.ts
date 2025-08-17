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
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch schedules for the user
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from("schedules")
      .select("id, name")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw new Error("Failed to fetch schedules");
    }

    const scheduleIds = schedules.map((s) => s.id);

    // Fetch bells for the user's schedules
    const { data: bells, error: bellsError } = await supabaseClient
      .from("bells")
      .select("schedule_id, time, label, days_of_week")
      .in("schedule_id", scheduleIds)
      .eq("user_id", user_id)
      .order("time", { ascending: true });

    if (bellsError) {
      console.error("Error fetching bells:", bellsError);
      throw new Error("Failed to fetch bells");
    }

    // Check test bell status for the user
    const { data: testBell, error: testBellError } = await supabaseClient
      .from("test_bells")
      .select("is_active")
      .eq("user_id", user_id)
      .single();

    if (testBellError && testBellError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching test bell status:", testBellError);
      throw new Error("Failed to fetch test bell status");
    }

    return new Response(
      JSON.stringify({
        schedules,
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