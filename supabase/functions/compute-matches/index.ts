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

    const body = (await req.json()) as { room_id?: string };
    if (!body.room_id) {
      return json({ error: "room_id_required" }, 400);
    }

    // Caller must be present in the room (checked with user-scoped client + RLS)
    const { data: presence, error: presenceError } = await userClient
      .from("presence")
      .select("id, room_id, is_visible")
      .eq("profile_id", user.id)
      .eq("room_id", body.room_id)
      .maybeSingle();

    if (presenceError) {
      return json({ error: presenceError.message }, 400);
    }
    if (!presence) {
      return json({ error: "not_present_in_room" }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin.rpc("compute_matches_for_room", {
      p_room_id: body.room_id,
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({ matches: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return json({ error: message }, 500);
  }
});
