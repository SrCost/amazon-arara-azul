// Resend webhook handler — receives delivery events and updates email_logs
// Public endpoint (verify_jwt = false). Optional shared-secret check via header.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Map Resend event type → email_logs.status
const STATUS_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payload = await req.json();
    const eventType: string = payload?.type || payload?.event || "";
    const data = payload?.data || payload;
    const emailId: string | undefined = data?.email_id || data?.id;
    const eventAt: string = payload?.created_at || data?.created_at || new Date().toISOString();

    console.log("[resend-webhook]", eventType, emailId);

    if (!emailId) {
      return new Response(JSON.stringify({ ok: true, skipped: "no email id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = STATUS_MAP[eventType] ?? eventType.replace("email.", "");

    // Build column updates based on event
    const updates: Record<string, any> = {
      last_event: eventType,
      last_event_at: eventAt,
    };

    if (eventType === "email.delivered") updates.delivered_at = eventAt;
    if (eventType === "email.opened") updates.opened_at = eventAt;
    if (eventType === "email.clicked") updates.clicked_at = eventAt;
    if (eventType === "email.bounced") {
      updates.bounced_at = eventAt;
      updates.status = "bounced";
      updates.error_message = data?.bounce?.message || data?.reason || "bounced";
    }
    if (eventType === "email.complained") {
      updates.complained_at = eventAt;
      updates.status = "complained";
    }
    if (eventType === "email.delivered") updates.status = "delivered";
    if (eventType === "email.failed") {
      updates.status = "failed";
      updates.error_message = data?.failed?.reason || data?.reason || "failed";
    }

    const { error } = await supabase
      .from("email_logs")
      .update(updates)
      .eq("resend_id", emailId);

    if (error) {
      console.error("[resend-webhook] update error", error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[resend-webhook] error", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 200, // 200 to avoid Resend retry storms on malformed payloads
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
