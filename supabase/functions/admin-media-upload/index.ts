// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth-user, x-jwt-claims",
};

async function resolveAuthUserId(req: Request, adminClient: any): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const {
        data: { user },
        error,
      } = await adminClient.auth.getUser(token);

      if (!error && user?.id) {
        return user.id;
      }
    }
  }

  const headerUser = req.headers.get("x-supabase-auth-user");
  if (headerUser) {
    return headerUser;
  }

  const jwtClaims = req.headers.get("x-jwt-claims");
  if (jwtClaims) {
    try {
      const parsed = JSON.parse(jwtClaims);
      if (parsed?.sub) {
        return String(parsed.sub);
      }
    } catch {
      // ignore malformed claims
    }
  }

  return null;
}

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

    if (!supabaseUrl || !serviceRoleKey) {
      return response({ error: "Missing Supabase environment configuration." }, 500);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const authUserId = await resolveAuthUserId(req, adminClient);
    if (!authUserId) {
      return response({ error: "Unauthorized." }, 401);
    }

    const { data: adminRow, error: adminError } = await adminClient
      .from("admins")
      .select("user_id")
      .eq("user_id", authUserId)
      .maybeSingle();

    if (adminError || !adminRow) {
      return response({ error: "Admin access required." }, 403);
    }

    const body = await req.json();
    const fileName = String(body?.fileName || "").trim();
    const folder = String(body?.folder || "").trim().toLowerCase();

    if (!fileName) {
      return response({ error: "fileName is required." }, 400);
    }

    if (!["photos", "audio", "thumbs"].includes(folder)) {
      return response({ error: "folder must be one of: photos, audio, thumbs." }, 400);
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;

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
