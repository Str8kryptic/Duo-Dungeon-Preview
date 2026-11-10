import { createClient } from "npm:@supabase/supabase-js@2";
import { calculateStepRewards } from "../_shared/step-rewards.ts";
import { STEP_ITEMS, STEP_RELICS } from "../_shared/step-catalog.ts";
import { validateLocalStepDate } from "../_shared/step-date.ts";
import { savedStepBaseline } from "../_shared/step-baseline.ts";

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

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const token = authorization.slice(7);
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Your session could not be verified. Please sign in again." }, 401);

    let body: { total?: unknown; date?: unknown; timeZone?: unknown };
    try { body = await req.json(); }
    catch { return json({ error: "Invalid step-sync request." }, 400); }

    const total = body?.total;
    if (!Number.isSafeInteger(total as number) || (total as number) < 0 || (total as number) > 100000) {
      return json({ error: "That step reading is invalid." }, 400);
    }
    let date: string;
    try { date = validateLocalStepDate(body?.date, body?.timeZone); }
    catch (error) {
      const reason = error instanceof Error ? error.message : "invalid_step_date";
      return json({ error: reason === "step_date_not_today" ? "That Health reading is not from today in your timezone." : "The step date or timezone is invalid." }, 400);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: row, error: readError } = await admin
        .from("player_saves")
        .select("save_data,revision")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (readError) {
        console.error("Could not load the player's save:", readError.message);
        return json({ error: "Your game save could not be loaded." }, 503);
      }
      if (!row?.save_data || typeof row.save_data !== "object" || Array.isArray(row.save_data)) {
        return json({ error: "Initialize your Development game save before syncing steps." }, 409);
      }

      const save = row.save_data as Record<string, any>;
      const revision = Number(row.revision ?? 0);
      if (!Number.isSafeInteger(revision) || revision < 0) return json({ error: "Your save version is invalid. Please contact support." }, 409);

      const { data: ledger, error: ledgerError } = await admin
        .from("player_step_syncs")
        .select("total_steps")
        .eq("user_id", authData.user.id)
        .eq("step_date", date)
        .maybeSingle();
      if (ledgerError) {
        console.error("Could not load the step baseline:", ledgerError.message);
        return json({ error: "Your step history could not be loaded." }, 503);
      }

      let baseline: number;
      try { baseline = savedStepBaseline(save, date); }
      catch { return json({ error: "Your saved step baseline is invalid. No rewards were changed." }, 409); }

      if (ledger) {
        const ledgerTotal = Number(ledger.total_steps);
        if (!Number.isSafeInteger(ledgerTotal) || ledgerTotal !== baseline) {
          return json({ error: "Your saved steps and secure step history do not match. No rewards were changed." }, 409);
        }
      }

      let reward;
      try {
        reward = calculateStepRewards({
          save, total: total as number, date,
          items: STEP_ITEMS as unknown as any[],
          relicCatalog: STEP_RELICS as unknown as any[],
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "step_reward_rejected";
        const status = reason === "step_total_regressed" ? 409 : 400;
        return json({ error: reason === "step_total_regressed" ? "This reading is lower than the last saved Health total." : "The step reward calculation rejected this reading." }, status);
      }

      const { data: committed, error: commitError } = await admin.rpc("commit_player_step_sync", {
        p_user_id: authData.user.id,
        p_expected_revision: revision,
        p_step_date: date,
        p_total_steps: total,
        p_save_data: reward.save,
      });
      if (commitError) {
        console.error("Atomic step reward commit failed:", commitError.message);
        return json({ error: "The step rewards could not be safely saved." }, 503);
      }
      const result = Array.isArray(committed) ? committed[0] : committed;
      if (result?.accepted) {
        return json({
          accepted: true,
          previousSteps: result.previous_steps,
          currentSteps: result.current_steps,
          deltaSteps: reward.delta,
          rewardDelta: reward.rewardDelta,
          currentRevision: result.current_revision,
          saveData: reward.save,
          alreadyCurrent: reward.alreadyCurrent || result.already_current,
          coins: reward.coins,
          xp: reward.xp,
          bankedAdded: reward.bankedAdded,
          overflowConverted: reward.overflowConverted,
          items: reward.items,
          relics: reward.relics,
        });
      }
      if (result?.rejection_reason === "save_revision_conflict" && attempt < 2) continue;
      if (result?.rejection_reason === "step_total_regressed") {
        return json({ accepted: false, error: "This reading is lower than the last accepted total.", currentSteps: result.current_steps }, 409);
      }
      return json({ accepted: false, error: "The step reward commit was rejected safely.", reason: result?.rejection_reason ?? "unknown" }, 409);
    }

    return json({ error: "Your save changed repeatedly. Please sync again." }, 409);
  } catch (error) {
    console.error("Unexpected step reward sync error:", error);
    return json({ error: "Step sync encountered an unexpected error." }, 500);
  }
});
