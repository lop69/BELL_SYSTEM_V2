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
    const device_id = body.device_id;

    if (!device_id || typeof device_id !== 'string' || device_id.trim() === '') {
      return new Response(JSON.stringify({ error: "A valid 'device_id' is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: device, error: deviceError } = await supabaseClient
      .from("devices")
      .select("schedule_id, user_id")
      .eq("id", device_id)
      .single();

    if (deviceError || !device) {
      return new Response(JSON.stringify({ error: `Device with ID '${device_id}' not found.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const { schedule_id, user_id } = device;

    // Mark the device as seen
    await supabaseClient
      .from("devices")
      .update({ is_connected: true, last_seen: new Date().toISOString() })
      .eq("id", device_id);

    const { data: schedule, error: scheduleError } = await supabaseClient
      .from("schedules")
      .select("name")
      .eq("id", schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return new Response(JSON.stringify({ schedule_name: "No Schedule Assigned", bells: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: bells, error: bellsError } = await supabaseClient
      .from("bells")
      .select("time, label, days_of_week")
      .eq("schedule_id", schedule_id)
      .order("time", { ascending: true });

    if (bellsError) {
      throw new Error("Failed to fetch bells for the assigned schedule.");
    }

    return new Response(
      JSON.stringify({
        schedule_name: schedule.name,
        bells,
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