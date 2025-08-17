/// <reference path="../_shared/types.d.ts" />

// @ts-ignore: Editor doesn't understand Deno's URL imports, but this is valid in the runtime
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Editor doesn't understand Deno's URL imports, but this is valid in the runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_DURATION_MS = 35000; // 35 seconds

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const user_id = body.user_id;

    if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
      return new Response(JSON.stringify({ error: "A valid 'user_id' is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: testBell, error: fetchError } = await supabaseAdmin
      .from("test_bells")
      .select("is_active, triggered_at")
      .eq("user_id", user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("DB Error fetching test bell:", fetchError);
      throw new Error("Database error fetching test bell status.");
    }

    if (!testBell || !testBell.is_active || !testBell.triggered_at) {
      return new Response(JSON.stringify({ test_bell_active: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const triggerTime = new Date(testBell.triggered_at).getTime();
    const now = new Date().getTime();

    if (now - triggerTime < TEST_DURATION_MS) {
      // Test is active and within the valid time window.
      return new Response(JSON.stringify({ test_bell_active: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Test has expired. Auto-disable it in the database.
      await supabaseAdmin
        .from("test_bells")
        .update({ is_active: false })
        .eq("user_id", user_id);
      
      return new Response(JSON.stringify({ test_bell_active: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});