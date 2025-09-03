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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    // POST request from the app to trigger the test
    if (req.method === "POST") {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
      );
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error } = await supabaseAdmin
        .from("global_test_signal")
        .update({ is_active: true, triggered_at: new Date().toISOString() })
        .eq("id", 1);

      if (error) throw error;

      return new Response(JSON.stringify({ message: "Test signal activated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // GET request from the ESP8266 to check the status
    if (req.method === "GET") {
      const { data: testSignal, error: fetchError } = await supabaseAdmin
        .from("global_test_signal")
        .select("is_active, triggered_at")
        .eq("id", 1)
        .single();

      if (fetchError) throw fetchError;

      if (!testSignal.is_active) {
        return new Response(JSON.stringify({ test_bell_active: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const triggerTime = new Date(testSignal.triggered_at).getTime();
      const now = new Date().getTime();

      if (now - triggerTime < TEST_DURATION_MS) {
        return new Response(JSON.stringify({ test_bell_active: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        await supabaseAdmin
          .from("global_test_signal")
          .update({ is_active: false })
          .eq("id", 1);
        
        return new Response(JSON.stringify({ test_bell_active: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});