import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // 1. Find reservations with check_in = tomorrow and checkin not completed
    const { data: checkinReservations } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email")
      .eq("check_in", fmt(tomorrow))
      .eq("checkin_completed", false)
      .in("status", ["pending", "confirmed"]);

    // 2. Find reservations with check_out = yesterday and checkout not completed
    const { data: checkoutReservations } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email")
      .eq("check_out", fmt(yesterday))
      .eq("checkout_completed", false)
      .in("status", ["pending", "confirmed"]);

    let checkinSent = 0;
    let checkoutSent = 0;

    // Send check-in emails (avoid duplicates by checking email_logs)
    for (const r of checkinReservations || []) {
      const { data: existing } = await supabase
        .from("email_logs")
        .select("id")
        .eq("reservation_id", r.id)
        .eq("email_type", "checkin_reminder")
        .maybeSingle();

      if (!existing) {
        // Call the existing send-checkin-email function
        const { error } = await supabase.functions.invoke("send-checkin-email", {
          body: { reservationId: r.id },
        });
        if (!error) {
          checkinSent++;
          // Log to avoid future duplicates
          await supabase.from("email_logs").insert({
            reservation_id: r.id,
            recipient_email: r.guest_email,
            email_type: "checkin_reminder",
            subject: `Check-in digital - ${r.guest_name}`,
            status: "sent",
            sent_at: new Date().toISOString(),
          });
        }
      }
    }

    // Send check-out emails
    for (const r of checkoutReservations || []) {
      const { data: existing } = await supabase
        .from("email_logs")
        .select("id")
        .eq("reservation_id", r.id)
        .eq("email_type", "checkout_reminder")
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.functions.invoke("send-checkout-email", {
          body: { reservationId: r.id },
        });
        if (!error) {
          checkoutSent++;
          await supabase.from("email_logs").insert({
            reservation_id: r.id,
            recipient_email: r.guest_email,
            email_type: "checkout_reminder",
            subject: `Check-out digital - ${r.guest_name}`,
            status: "sent",
            sent_at: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`Cron complete: ${checkinSent} checkin emails, ${checkoutSent} checkout emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        checkin_sent: checkinSent,
        checkout_sent: checkoutSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cron error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
