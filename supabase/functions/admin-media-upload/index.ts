// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return response({ error: "Missing Supabase environment configuration." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return response({ error: "Missing authorization header." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return response({ error: "Unauthorized." }, 401);
    }

    const { data: adminRow, error: adminError } = await adminClient
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      return response({ error: "Admin access required." }, 403);
    }

    const body = await req.json();
    const fileName = String(body?.fileName || "").trim();

    if (!fileName) {
      return response({ error: "fileName is required." }, 400);
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `uploads/${Date.now()}-${safeName}`;

    const { data, error } = await adminClient.storage.from("media").createSignedUploadUrl(path);
    if (error || !data) {
      return response({ error: error?.message || "Unable to create upload URL." }, 400);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${path}`;

    return response({
      success: true,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl,
    });
  } catch (error) {
    return response({ error: (error as Error).message }, 500);
  }
});
