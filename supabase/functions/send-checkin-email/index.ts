import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOGO_URL = "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/logo-arara-azul.png";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reservationId } = await req.json();
    if (!reservationId) throw new Error("reservationId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get reservation
    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email, room_name, check_in, check_out")
      .eq("id", reservationId)
      .single();

    if (rErr || !reservation) throw new Error("Reservation not found");

    // Generate token
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await supabase.from("booking_tokens").insert({
      reservation_id: reservationId,
      token,
      type: "checkin",
      expires_at: expiresAt,
    });

    const siteUrl = (Deno.env.get("SITE_URL") || "https://pousadararazul.com").replace(/\/+$/, "");
    const checkinLink = `${siteUrl}/checkin?token=${token}`;

    // Bloco de Pré-Chegada apenas se o questionário ainda NÃO foi respondido
    const { data: existingPreArrival } = await supabase
      .from("pre_arrival_responses")
      .select("id, status, first_sent_at")
      .eq("reservation_id", reservationId)
      .maybeSingle();

    const preArrivalAnswered = ["answered", "updated"].includes(existingPreArrival?.status || "");
    let preArrivalLink: string | null = null;

    if (!preArrivalAnswered) {
      // Token independente para o questionário de Pré-Chegada (sem relação com a FNRH)
      const preArrivalToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      await supabase.from("booking_tokens").insert({
        reservation_id: reservationId,
        token: preArrivalToken,
        type: "pre_arrival",
        expires_at: new Date(new Date(reservation.check_out + "T12:00:00Z").getTime() + 24 * 60 * 60 * 1000).toISOString(),
      });
      preArrivalLink = `${siteUrl}/pre-chegada?token=${preArrivalToken}`;

      const nowIso = new Date().toISOString();
      if (existingPreArrival) {
        await supabase.from("pre_arrival_responses").update({
          status: existingPreArrival.status === "pending" ? "sent" : existingPreArrival.status,
          first_sent_at: existingPreArrival.first_sent_at || nowIso,
          last_sent_at: nowIso,
          last_send_origin: "auto",
        }).eq("id", existingPreArrival.id);
      } else {
        await supabase.from("pre_arrival_responses").insert({
          reservation_id: reservationId,
          status: "sent",
          first_sent_at: nowIso,
          last_sent_at: nowIso,
          last_send_origin: "auto",
        });
      }

      // Auditoria reaproveitando o registro de atividades existente
      await supabase.from("activity_log").insert({
        user_email: "system",
        action: "pre_arrival_sent_auto",
        description: "Link de Pre-Chegada enviado automaticamente junto ao e-mail de check-in",
        entity_type: "pre_arrival_responses",
        entity_id: reservationId,
        metadata: { origin: "auto", trigger: "send-checkin-email" },
      });
    }





    const formatDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
<tr><td align="center" style="background:linear-gradient(135deg,#0B3A66,#0F6B4D);padding:40px 30px;color:#fff;">
<img src="${LOGO_URL}" width="100" style="border-radius:50%;margin-bottom:16px;" alt="Pousada Arara Azul">
<h1 style="margin:0;font-size:24px;">Check-in Digital</h1>
<p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Prepare-se para sua experiência</p>
</td></tr>
<tr><td style="padding:40px;color:#2D3748;font-size:15px;line-height:1.7;">
<p>Olá <strong>${reservation.guest_name}</strong>,</p>
<p>Sua estadia no <strong>${reservation.room_name || "bangalô"}</strong> está chegando! Complete seu check-in digital para agilizar sua chegada.</p>
<table width="100%" style="background:#F6FBF9;border-radius:12px;border:1px solid #E4EFEA;margin:24px 0;">
<tr><td style="padding:20px;">
<table width="100%">
<tr><td style="padding:6px 0;color:#6B7280;">Check-in</td><td align="right"><strong>${formatDate(reservation.check_in)}</strong></td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">Check-out</td><td align="right"><strong>${formatDate(reservation.check_out)}</strong></td></tr>
</table></td></tr></table>
<table width="100%"><tr><td align="center">
<a href="${checkinLink}" style="background:#0B3A66;color:#fff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;font-size:16px;">
Fazer Check-in Agora
</a></td></tr></table>
${preArrivalLink ? `<table width="100%" style="background:#F6FBF9;border-radius:12px;border:1px solid #E4EFEA;margin:24px 0 0;">
<tr><td style="padding:20px 22px;" align="center">

<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F6B4D;">🌿 Prepare sua chegada</p>
<p style="margin:0 0 16px;font-size:13px;color:#4A5568;line-height:1.6;">Conte suas preferências de alimentação, bem-estar e detalhes especiais para deixarmos tudo do seu jeito.</p>
<a href="${preArrivalLink}" style="background:#0F6B4D;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px;letter-spacing:0.5px;">PREPARAR MINHA CHEGADA</a>
</td></tr></table>` : ""}


<table width="100%" style="background:#FFF9F0;border-radius:12px;border:1px solid #F0E4D0;margin:24px 0 0;">
<tr><td style="padding:18px 22px;">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#7A4A00;">📋 Política de Cancelamento</p>
<p style="margin:0 0 10px;font-size:12px;color:#5C4A2A;line-height:1.5;">Cancelamento com até 30 dias: reembolso parcial conforme política. Menos de 7 dias do check-in ou no-show: sem reembolso.</p>
<a href="https://pousadararazul.com/docs/politica-cancelamento.pdf" style="color:#7A4A00;font-size:12px;font-weight:600;text-decoration:underline;">Ver política completa (PDF)</a>
</td></tr></table>
<p style="margin-top:20px;color:#6B7280;font-size:13px;">Este link expira em 48 horas.</p>
</td></tr>
<tr><td align="center" style="background:#0B3A66;padding:20px;color:rgba(255,255,255,0.7);font-size:12px;">
© ${new Date().getFullYear()} Pousada Arara Azul — Manacapuru, AM
</td></tr></table></td></tr></table></body></html>`;

    // Send via Resend
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Pousada Arara Azul <reservas@pousadararazul.com>",
        to: [reservation.guest_email],
        subject: "🌿 Complete seu Check-in Digital — Pousada Arara Azul",
        html,
      }),
    });

    const emailData = await emailRes.json();

    // Log
    await supabase.from("email_logs").insert({
      reservation_id: reservationId,
      recipient_email: reservation.guest_email,
      email_type: "checkin_link",
      subject: "Check-in Digital",
      status: emailRes.ok ? "sent" : "error",
      resend_id: emailData.id || null,
      error_message: emailRes.ok ? null : JSON.stringify(emailData),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
