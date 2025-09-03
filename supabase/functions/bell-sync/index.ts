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
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid or empty JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const device_id = body.device_id;

    if (!device_id || typeof device_id !== 'string' || device_id.trim() === '') {
      return new Response(JSON.stringify({ error: "A valid 'device_id' is required in the request body." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { data: device, error: deviceError } = await supabaseAdmin
      .from("devices")
      .select("schedule_id")
      .eq("id", device_id)
      .single();

    if (deviceError) {
      console.error(`Device lookup error for ID ${device_id}:`, deviceError.message);
      if (deviceError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: `Device with ID '${device_id}' not found.` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      throw new Error(`Database error while querying for device: ${deviceError.message}`);
    }

    await supabaseAdmin
      .from("devices")
      .update({ is_connected: true, last_seen: new Date().toISOString() })
      .eq("id", device_id);

    if (!device.schedule_id) {
      return new Response(JSON.stringify({ schedule_name: "No Schedule Assigned", bells: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { schedule_id } = device;

    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from("schedules")
      .select("name")
      .eq("id", schedule_id)
      .single();

    if (scheduleError || !schedule) {
      console.error(`Schedule lookup error for ID ${schedule_id}:`, scheduleError?.message);
      return new Response(JSON.stringify({ schedule_name: "Assigned schedule not found", bells: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: bells, error: bellsError } = await supabaseAdmin
      .from("bells")
      .select("time, label, days_of_week")
      .eq("schedule_id", schedule_id)
      .order("time", { ascending: true });

    if (bellsError) {
      throw new Error(`Failed to fetch bells for schedule ID ${schedule_id}: ${bellsError.message}`);
    }

    return new Response(
      JSON.stringify({
        schedule_name: schedule.name,
        bells: bells || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Edge Function uncaught error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});