import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "adm@pousadararazul.com";
const RESERVAS_EMAIL = "reservas@pousadararazul.com";

const RECIPIENT_BY_TYPE: Record<string, string> = {
  new_reservation: ADMIN_EMAIL,
  cancellation: ADMIN_EMAIL,
  new_message: RESERVAS_EMAIL,
};

interface NotificationRequest {
  type: "new_reservation" | "cancellation" | "new_message";
  data: Record<string, unknown>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const baseStyle = `
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:#f2f4f7;margin:0;padding:0;
`;

const wrapEmail = (title: string, emoji: string, color: string, body: string) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="${baseStyle}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 15px;">
<table width="560" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
<tr><td style="background:${color};padding:24px 28px;color:#fff;">
<h1 style="margin:0;font-size:20px;font-weight:600;">${emoji} ${title}</h1>
<p style="margin:6px 0 0;font-size:12px;opacity:0.85;">${new Date().toLocaleString("pt-BR", { timeZone: "America/Manaus" })}</p>
</td></tr>
<tr><td style="padding:28px;color:#2D3748;font-size:14px;line-height:1.7;">
${body}
</td></tr>
<tr><td style="padding:16px 28px;background:#f8f9fa;font-size:11px;color:#999;text-align:center;">
Notificação interna — Pousada Arara Azul
</td></tr>
</table></td></tr></table></body></html>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;color:#6B7280;width:40%;">${label}</td><td style="padding:6px 0;"><strong>${value}</strong></td></tr>`;

function buildNewReservationEmail(d: Record<string, unknown>) {
  const body = `
<p style="margin:0 0 16px;">Uma nova reserva foi realizada no sistema.</p>
<table width="100%" style="border-collapse:collapse;">
${row("Hóspede", String(d.guest_name || "—"))}
${row("Bangalô", String(d.room_name || "—"))}
${row("Check-in", d.check_in ? formatDate(String(d.check_in)) : "—")}
${row("Check-out", d.check_out ? formatDate(String(d.check_out)) : "—")}
${row("Hóspedes", String(d.guests || "—"))}
${row("Valor Total", d.total_price ? formatCurrency(Number(d.total_price)) : "—")}
${row("Pagamento", String(d.payment_method === "pix" ? "PIX" : d.payment_method === "credit_card" ? "Cartão" : d.payment_method || "—"))}
${row("Origem", String(d.reservation_source || "site"))}
</table>`;
  return {
    subject: `🏨 Nova Reserva — ${d.guest_name || "Hóspede"}`,
    html: wrapEmail("Nova Reserva", "🏨", "#0B3A66", body),
  };
}

function buildCancellationEmail(d: Record<string, unknown>) {
  const body = `
<p style="margin:0 0 16px;">Uma reserva foi cancelada.</p>
<table width="100%" style="border-collapse:collapse;">
${row("Hóspede", String(d.guest_name || "—"))}
${row("Email", String(d.guest_email || "—"))}
${row("Bangalô", String(d.room_name || "—"))}
${row("Check-in", d.check_in ? formatDate(String(d.check_in)) : "—")}
${row("Check-out", d.check_out ? formatDate(String(d.check_out)) : "—")}
${row("Valor", d.total_price ? formatCurrency(Number(d.total_price)) : "—")}
${d.reason ? row("Motivo", String(d.reason)) : ""}
</table>`;
  return {
    subject: `❌ Reserva Cancelada — ${d.guest_name || "Hóspede"}`,
    html: wrapEmail("Reserva Cancelada", "❌", "#DC2626", body),
  };
}

function buildNewMessageEmail(d: Record<string, unknown>) {
  const body = `
<p style="margin:0 0 16px;">Nova mensagem recebida pelo formulário de contato.</p>
<table width="100%" style="border-collapse:collapse;">
${row("Nome", String(d.name || "—"))}
${row("Email", String(d.email || "—"))}
${d.phone ? row("Telefone", String(d.phone)) : ""}
</table>
<div style="margin:16px 0;padding:16px;background:#f8f9fa;border-radius:8px;border-left:3px solid #0B3A66;">
<p style="margin:0;white-space:pre-wrap;">${String(d.message || "—")}</p>
</div>`;
  return {
    subject: `💬 Nova Mensagem — ${d.name || "Visitante"}`,
    html: wrapEmail("Nova Mensagem do Cliente", "💬", "#0F6B4D", body),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, data }: NotificationRequest = await req.json();

    if (!type || !data) throw new Error("type and data are required");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    let email: { subject: string; html: string };

    switch (type) {
      case "new_reservation":
        email = buildNewReservationEmail(data);
        break;
      case "cancellation":
        email = buildCancellationEmail(data);
        break;
      case "new_message":
        email = buildNewMessageEmail(data);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Pousada Arara Azul <reservas@pousadararazul.com>",
        to: [RECIPIENT_BY_TYPE[type] ?? ADMIN_EMAIL],
        subject: email.subject,
        html: email.html,
      }),
    });

    const resData = await res.json();

    return new Response(
      JSON.stringify({ success: res.ok, id: resData.id }),
      { status: res.ok ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Internal notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
