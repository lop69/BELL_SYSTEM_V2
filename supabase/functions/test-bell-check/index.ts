/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

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
    const body = await req.json();
    const user_id = body.user_id;

    if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
      return new Response(JSON.stringify({ error: "A valid 'user_id' string is required in the request body." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: testBell, error: testBellError } = await supabaseAdmin
      .from("test_bells")
      .select("is_active")
      .eq("user_id", user_id)
      .single();

    if (testBellError && testBellError.code !== 'PGRST116') {
      console.error("Error fetching test bell status:", testBellError);
      throw new Error("Database error while fetching test bell status.");
    }

    return new Response(
      JSON.stringify({
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