import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESERVAS_EMAIL = "reservas@pousadararazul.com";

const formatDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 20) {
      return new Response(JSON.stringify({ error: "token required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Valida o token de pré-chegada (não expirado) para descobrir a reserva
    const { data: tokenRow } = await supabase
      .from("booking_tokens")
      .select("reservation_id, expires_at, type")
      .eq("token", token)
      .eq("type", "pre_arrival")
      .maybeSingle();

    if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "token inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reservationId = tokenRow.reservation_id;

    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, guest_name, check_in, check_out, guests, room_name")
      .eq("id", reservationId)
      .single();

    const { data: response } = await supabase
      .from("pre_arrival_responses")
      .select("status, answered_at, updated_at")
      .eq("reservation_id", reservationId)
      .maybeSingle();

    if (!reservation || !response) throw new Error("Dados de pré-chegada não encontrados");

    const { count: roomsCount } = await supabase
      .from("reservation_rooms")
      .select("id", { count: "exact", head: true })
      .eq("reservation_id", reservationId);

    const code = `PAA-${reservationId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    const siteUrl = (Deno.env.get("SITE_URL") || "https://pousadararazul.com").replace(/\/+$/, "");
    const answeredAt = new Date(response.status === "updated" ? (response.updated_at as string) : (response.answered_at as string))
      .toLocaleString("pt-BR", { timeZone: "America/Manaus" });

    const row = (label: string, value: string) =>
      `<tr><td style="padding:6px 0;color:#6B7280;width:45%;">${label}</td><td style="padding:6px 0;"><strong>${value}</strong></td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 15px;">
<table width="560" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
<tr><td style="background:#0F6B4D;padding:24px 28px;color:#fff;">
<h1 style="margin:0;font-size:20px;font-weight:600;">🌿 Novo questionário de pré-chegada</h1>
<p style="margin:6px 0 0;font-size:12px;opacity:0.85;">Reserva #${code}</p>
</td></tr>
<tr><td style="padding:28px;color:#2D3748;font-size:14px;line-height:1.7;">
<p style="margin:0 0 16px;">${response.status === "updated" ? "Um hóspede atualizou o questionário de pré-chegada." : "Um hóspede concluiu o questionário de pré-chegada."}</p>
<table width="100%" style="border-collapse:collapse;">
${row("Responsável", reservation.guest_name || "—")}
${row("Reserva", code)}
${row("Período", `${formatDate(reservation.check_in)} → ${formatDate(reservation.check_out)}`)}
${row("Bangalôs", String(roomsCount && roomsCount > 0 ? roomsCount : 1))}
${row("Respondido em", answeredAt)}
</table>
<table width="100%" style="margin:24px 0 0;"><tr><td align="center">
<a href="${siteUrl}/admin/reservations" style="background:#0B3A66;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px;">VER RESPOSTAS NO DASHBOARD</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:16px 28px;background:#f8f9fa;font-size:11px;color:#999;text-align:center;">
Notificação interna — Pousada Rará Azul
</td></tr></table></td></tr></table></body></html>`;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Pousada Rará Azul <reservas@pousadararazul.com>",
        to: [RESERVAS_EMAIL],
        subject: `Novo questionário de pré-chegada — Reserva #${code}`,
        html,
      }),
    });
    const emailData = await emailRes.json();

    await supabase.from("email_logs").insert({
      reservation_id: reservationId,
      recipient_email: RESERVAS_EMAIL,
      email_type: "pre_arrival_internal",
      subject: `Novo questionário de pré-chegada — Reserva #${code}`,
      status: emailRes.ok ? "sent" : "error",
      sent_at: new Date().toISOString(),
      resend_id: emailData.id || null,
      error_message: emailRes.ok ? null : JSON.stringify(emailData),
    });

    if (!emailRes.ok) {
      console.error("Resend error", emailRes.status, JSON.stringify(emailData));
      return new Response(JSON.stringify({ error: "Falha no envio", details: emailData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-pre-arrival error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
