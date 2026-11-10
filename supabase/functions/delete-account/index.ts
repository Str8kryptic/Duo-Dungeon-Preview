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
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in is required." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) {
      console.error("Account deletion environment is unavailable.");
      return json({ error: "Account deletion is temporarily unavailable." }, 503);
    }

    let body: { password?: unknown; confirmation?: unknown };
    try { body = await req.json(); }
    catch { return json({ error: "Invalid deletion request." }, 400); }
    if (body?.confirmation !== "DELETE" || typeof body?.password !== "string" || !body.password) {
      return json({ error: "Enter DELETE and your current password to confirm account deletion." }, 400);
    }

    const token = authorization.slice(7);
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user?.email) return json({ error: "Your session could not be verified. Please sign in again." }, 401);

    const reauthClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: reauth, error: reauthError } = await reauthClient.auth.signInWithPassword({
      email: authData.user.email,
      password: body.password,
    });
    if (reauthError || reauth.user?.id !== authData.user.id) {
      return json({ error: "The current password was not accepted. Nothing was deleted." }, 401);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: dataError } = await admin.rpc("delete_player_account_data", {
      p_user_id: authData.user.id,
    });
    if (dataError) {
      console.error("Could not remove player data for account deletion:", dataError.message);
      return json({ error: "Your player data could not be safely removed. Your account is still active." }, 503);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(authData.user.id);
    if (deleteError) {
      console.error("Player data removed but Auth account deletion failed:", deleteError.message);
      return json({ error: "Your game data was removed, but the login account could not be deleted. Contact support before signing up again." }, 503);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Unexpected account deletion error:", error);
    return json({ error: "Account deletion encountered an unexpected error." }, 500);
  }
});