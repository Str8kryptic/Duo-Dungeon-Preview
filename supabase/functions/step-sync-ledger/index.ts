import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://str8kryptic.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in is required." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) {
      console.error("Required Supabase function environment is unavailable.");
      return json({ error: "Step sync is temporarily unavailable." }, 503);
    }

    const token = authorization.slice(7);
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Your session could not be verified. Please sign in again." }, 401);

    let body: { total?: unknown; date?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid step-sync request." }, 400);
    }
    const total = body?.total;
    const date = body?.date;
    if (!Number.isSafeInteger(total) || (total as number) < 0 || (total as number) > 100000 ||
        typeof date !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {
      return json({ error: "That step reading is invalid." }, 400);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.rpc("record_player_step_sync", {
      p_user_id: authData.user.id,
      p_step_date: date,
      p_total_steps: total,
    });
    if (error) {
      console.error("Step ledger rejected a request:", error.message);
      return json({ error: "The step reading could not be recorded." }, 400);
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.accepted) {
      return json({ accepted: false, error: "This reading is lower than the last accepted total for today.", currentSteps: result?.current_steps ?? null }, 409);
    }
    return json({
      accepted: true,
      previousSteps: result.previous_steps,
      currentSteps: result.current_steps,
      deltaSteps: result.delta_steps,
      alreadyCurrent: result.already_current,
    });
  } catch (error) {
    console.error("Unexpected step ledger error:", error);
    return json({ error: "Step sync encountered an unexpected error." }, 500);
  }
});