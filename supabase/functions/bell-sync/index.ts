/// <reference path="../_shared/types.d.ts" />

// @ts-ignore: Editor doesn't understand Deno's URL imports, but this is valid in the runtime
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Editor doesn't understand Deno's URL imports, but this is valid in the runtime
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
    const body = await req.json();
    const schedule_id = body.schedule_id;

    if (!schedule_id || typeof schedule_id !== 'string' || schedule_id.trim() === '') {
      return new Response(JSON.stringify({ error: "A valid 'schedule_id' string is required in the request body." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: schedule, error: scheduleError } = await supabaseClient
      .from("schedules")
      .select("name, user_id")
      .eq("id", schedule_id)
      .single();

    if (scheduleError || !schedule) {
      if (scheduleError && scheduleError.code !== 'PGRST116') { // Not a "no rows found" error
        console.error("Database error fetching schedule:", scheduleError);
        throw new Error("Database error while fetching schedule.");
      }
      return new Response(JSON.stringify({ error: `Schedule with ID '${schedule_id}' not found.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, // Not Found is more appropriate
      });
    }

    const { name: schedule_name, user_id } = schedule;

    const { data: bells, error: bellsError } = await supabaseClient
      .from("bells")
      .select("time, label, days_of_week")
      .eq("schedule_id", schedule_id)
      .order("time", { ascending: true });

    if (bellsError) {
      console.error("Error fetching bells:", bellsError);
      throw new Error("Failed to fetch bells");
    }

    const { data: testBell, error: testBellError } = await supabaseClient
      .from("test_bells")
      .select("is_active")
      .eq("user_id", user_id)
      .single();

    if (testBellError && testBellError.code !== 'PGRST116') {
      console.error("Error fetching test bell status:", testBellError);
      throw new Error("Failed to fetch test bell status");
    }

    return new Response(
      JSON.stringify({
        schedule_name: schedule_name,
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
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});