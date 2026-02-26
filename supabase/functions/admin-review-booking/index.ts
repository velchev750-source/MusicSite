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

function durationToMinutes(value: string): number | null {
  const map: Record<string, number> = {
    "30 minutes": 30,
    "1 hour": 60,
    "1.5 hours": 90,
    "2 hours": 120,
    "3 hours": 180,
    "4+ hours": 240,
  };

  if (map[value]) {
    return map[value];
  }

  const parsedHours = Number.parseFloat(value);
  if (Number.isFinite(parsedHours) && parsedHours > 0) {
    return Math.round(parsedHours * 60);
  }

  return null;
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
    const inquiryId = String(body?.inquiryId || "");
    const action = String(body?.action || "").toLowerCase();

    if (!inquiryId || !["confirm", "deny"].includes(action)) {
      return response({ error: "Invalid payload." }, 400);
    }

    const { data: inquiry, error: inquiryError } = await adminClient
      .from("booking_inquiries")
      .select("id, user_id, event_date, event_time, desired_duration, status")
      .eq("id", inquiryId)
      .maybeSingle();

    if (inquiryError || !inquiry) {
      return response({ error: "Inquiry not found." }, 404);
    }

    if (action === "deny") {
      const { error: denyError } = await adminClient
        .from("booking_inquiries")
        .update({ status: "rejected" })
        .eq("id", inquiryId)
        .in("status", ["pending", "confirmed"]);

      if (denyError) {
        return response({ error: denyError.message }, 400);
      }

      return response({ success: true, status: "rejected" });
    }

    const minutes = durationToMinutes(inquiry.desired_duration);
    if (!minutes) {
      return response({ error: "Invalid inquiry duration." }, 400);
    }

    const startAt = new Date(`${inquiry.event_date}T${String(inquiry.event_time).slice(0, 5)}:00Z`);
    const endAt = new Date(startAt.getTime() + minutes * 60_000);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return response({ error: "Invalid inquiry time." }, 400);
    }

    const { error: bookingError } = await adminClient.from("bookings").insert({
      inquiry_id: inquiry.id,
      user_id: inquiry.user_id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    });

    if (bookingError) {
      if (bookingError.code === "23P01") {
        return response({ error: "This booking overlaps with an existing confirmed booking." }, 409);
      }
      return response({ error: bookingError.message }, 400);
    }

    const { error: statusError } = await adminClient
      .from("booking_inquiries")
      .update({ status: "confirmed" })
      .eq("id", inquiryId);

    if (statusError) {
      return response({ error: statusError.message }, 400);
    }

    return response({ success: true, status: "confirmed" });
  } catch (error) {
    return response({ error: (error as Error).message }, 500);
  }
});
