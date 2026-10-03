import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "missing_authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: "server_misconfigured" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      db: { schema: "lobby" },
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = (await req.json()) as {
      to_profile_id?: string;
      message?: string;
    };
    if (!body.to_profile_id) {
      return json({ error: "to_profile_id_required" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      db: { schema: "lobby" },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // RPC enforces: same-room visible discovery, blocks, daily rate limit (10/UTC day)
    const { data, error } = await admin.rpc("send_signal", {
      p_from: user.id,
      p_to: body.to_profile_id,
      p_message: body.message ?? null,
    });

    if (error) {
      const msg = error.message ?? "signal_failed";
      const status =
        msg.includes("daily signal limit") || msg.includes("already")
          ? 429
          : msg.includes("blocked") || msg.includes("not discoverable")
            ? 403
            : 400;
      return json({ error: msg }, status);
    }

    return json({ signal: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return json({ error: message }, 500);
  }
});
