import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOGO_URL = "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/logo-arara-azul.png";

type Lang = "pt" | "en" | "es" | "fr" | "de";

const COPY: Record<Lang, Record<string, string>> = {
  pt: {
    subject: "Podemos preparar sua chegada à Pousada Arara Azul? 🌿",
    header: "Prepare sua chegada",
    tagline: "Vamos deixar tudo do seu jeito",
    hello: "Olá",
    intro: "Faltam poucos dias para a sua estadia na Pousada Arara Azul. Para que possamos preparar tudo do seu jeito — alimentação, saúde e detalhes especiais — reserve dois minutinhos e conte um pouco sobre você.",
    checkin: "Check-in",
    checkout: "Check-out",
    cta: "PREPARAR MINHA CHEGADA",
    optional: "Todas as perguntas são opcionais e servem apenas para cuidarmos melhor de você.",
    already: "Caso você já tenha preenchido o formulário, pode desconsiderar este e-mail.",
  },
  en: {
    subject: "May we prepare your arrival at Pousada Arara Azul? 🌿",
    header: "Prepare your arrival",
    tagline: "Let's tailor everything for you",
    hello: "Hello",
    intro: "Your stay at Pousada Arara Azul is coming up. So we can prepare everything just the way you like — meals, wellbeing and special details — please take two minutes to tell us a bit about you.",
    checkin: "Check-in",
    checkout: "Check-out",
    cta: "PREPARE MY ARRIVAL",
    optional: "All questions are optional and only help us take better care of you.",
    already: "If you have already filled in the form, please disregard this email.",
  },
  es: {
    subject: "¿Podemos preparar su llegada a Pousada Arara Azul? 🌿",
    header: "Prepare su llegada",
    tagline: "Dejaremos todo a su gusto",
    hello: "Hola",
    intro: "Su estadía en Pousada Arara Azul está cerca. Para que podamos preparar todo a su gusto — alimentación, bienestar y detalles especiales — dedique dos minutos a contarnos un poco sobre usted.",
    checkin: "Check-in",
    checkout: "Check-out",
    cta: "PREPARAR MI LLEGADA",
    optional: "Todas las preguntas son opcionales y solo nos ayudan a cuidarle mejor.",
    already: "Si ya completó el formulario, puede ignorar este correo.",
  },
  fr: {
    subject: "Pouvons-nous préparer votre arrivée à la Pousada Arara Azul ? 🌿",
    header: "Préparez votre arrivée",
    tagline: "Tout sera à votre goût",
    hello: "Bonjour",
    intro: "Votre séjour à la Pousada Arara Azul approche. Pour que nous puissions tout préparer selon vos préférences — repas, bien-être et détails particuliers — prenez deux minutes pour nous parler de vous.",
    checkin: "Arrivée",
    checkout: "Départ",
    cta: "PRÉPARER MON ARRIVÉE",
    optional: "Toutes les questions sont facultatives et nous aident simplement à mieux vous accueillir.",
    already: "Si vous avez déjà rempli le formulaire, vous pouvez ignorer cet e-mail.",
  },
  de: {
    subject: "Dürfen wir Ihre Ankunft in der Pousada Arara Azul vorbereiten? 🌿",
    header: "Ankunft vorbereiten",
    tagline: "Alles nach Ihren Wünschen",
    hello: "Hallo",
    intro: "Ihr Aufenthalt in der Pousada Arara Azul steht bevor. Damit wir alles nach Ihren Wünschen vorbereiten können — Verpflegung, Wohlbefinden und besondere Details — nehmen Sie sich zwei Minuten Zeit und erzählen Sie uns etwas über sich.",
    checkin: "Check-in",
    checkout: "Check-out",
    cta: "MEINE ANKUNFT VORBEREITEN",
    optional: "Alle Fragen sind freiwillig und helfen uns nur, besser für Sie zu sorgen.",
    already: "Falls Sie das Formular bereits ausgefüllt haben, können Sie diese E-Mail ignorieren.",
  },
};

const LOCALES: Record<Lang, string> = {
  pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reservationId, origin } = await req.json();
    if (!reservationId || typeof reservationId !== "string") {
      return new Response(JSON.stringify({ error: "reservationId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sendOrigin: "auto" | "manual" = origin === "auto" ? "auto" : "manual";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email, check_in, check_out, status, guest_language")
      .eq("id", reservationId)
      .single();

    if (rErr || !reservation) throw new Error("Reservation not found");
    if (!reservation.guest_email) throw new Error("Reserva sem e-mail de hóspede");
    if (!["pending", "confirmed"].includes(reservation.status || "")) {
      return new Response(JSON.stringify({ error: "Reserva não está ativa" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang: Lang = (["pt", "en", "es", "fr", "de"].includes(reservation.guest_language)
      ? reservation.guest_language
      : "pt") as Lang;
    const c = COPY[lang];

    // Token de pré-chegada: válido até o dia seguinte ao check-out
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const expiresAt = new Date(new Date(reservation.check_out + "T12:00:00Z").getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenErr } = await supabase.from("booking_tokens").insert({
      reservation_id: reservationId,
      token,
      type: "pre_arrival",
      expires_at: expiresAt,
    });
    if (tokenErr) throw new Error(tokenErr.message);

    const siteUrl = (Deno.env.get("SITE_URL") || "https://pousadararazul.com").replace(/\/+$/, "");
    const link = `${siteUrl}/pre-chegada?token=${token}`;

    const formatDate = (d: string) =>
      new Date(d + "T12:00:00").toLocaleDateString(LOCALES[lang], { day: "2-digit", month: "long", year: "numeric" });

    const html = `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
<tr><td align="center" style="background:linear-gradient(135deg,#0B3A66,#0F6B4D);padding:40px 30px;color:#fff;">
<img src="${LOGO_URL}" width="100" style="border-radius:50%;margin-bottom:16px;" alt="Pousada Arara Azul">
<h1 style="margin:0;font-size:24px;">${c.header}</h1>
<p style="margin:8px 0 0;opacity:0.9;font-size:14px;">${c.tagline}</p>
</td></tr>
<tr><td style="padding:40px 32px;color:#2D3748;font-size:15px;line-height:1.7;">
<p style="margin:0 0 12px;">${c.hello} <strong>${reservation.guest_name}</strong>,</p>
<p style="margin:0 0 20px;">${c.intro}</p>
<table width="100%" style="background:#F6FBF9;border-radius:12px;border:1px solid #E4EFEA;margin:0 0 24px;">
<tr><td style="padding:20px;">
<table width="100%">
<tr><td style="padding:6px 0;color:#6B7280;">${c.checkin}</td><td align="right"><strong>${formatDate(reservation.check_in)}</strong></td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">${c.checkout}</td><td align="right"><strong>${formatDate(reservation.check_out)}</strong></td></tr>
</table></td></tr></table>
<table width="100%"><tr><td align="center">
<a href="${link}" style="background:#0F6B4D;color:#fff;padding:16px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:15px;letter-spacing:0.5px;">${c.cta}</a>
</td></tr></table>
<p style="margin:24px 0 0;color:#6B7280;font-size:13px;">${c.optional}</p>
<p style="margin:8px 0 0;color:#9AA5B1;font-size:12px;">${c.already}</p>
</td></tr>
<tr><td align="center" style="background:#0B3A66;padding:20px;color:rgba(255,255,255,0.7);font-size:12px;">
© ${new Date().getFullYear()} Pousada Arara Azul — Manacapuru, AM
</td></tr></table></td></tr></table></body></html>`;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Pousada Arara Azul <reservas@pousadararazul.com>",
        to: [reservation.guest_email],
        subject: c.subject,
        html,
      }),
    });
    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error", emailRes.status, JSON.stringify(emailData));
      await supabase.from("email_logs").insert({
        reservation_id: reservationId,
        recipient_email: reservation.guest_email,
        email_type: sendOrigin === "auto" ? "pre_arrival_reminder" : "pre_arrival_link",
        subject: c.subject,
        status: "error",
        error_message: JSON.stringify(emailData),
      });
      return new Response(JSON.stringify({ error: "Falha no envio do e-mail", details: emailData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("pre_arrival_responses")
      .select("id, status, first_sent_at, reminders_sent")
      .eq("reservation_id", reservationId)
      .maybeSingle();

    if (existing) {
      await supabase.from("pre_arrival_responses").update({
        status: existing.status === "pending" ? "sent" : existing.status,
        last_sent_at: now,
        first_sent_at: existing.first_sent_at || now,
        last_send_origin: sendOrigin,
        reminders_sent: sendOrigin === "auto" ? (existing.reminders_sent || 0) + 1 : existing.reminders_sent,
        language: lang,
      }).eq("id", existing.id);
    } else {
      await supabase.from("pre_arrival_responses").insert({
        reservation_id: reservationId,
        status: "sent",
        language: lang,
        first_sent_at: now,
        last_sent_at: now,
        last_send_origin: sendOrigin,
        reminders_sent: sendOrigin === "auto" ? 1 : 0,
      });
    }

    await supabase.from("email_logs").insert({
      reservation_id: reservationId,
      recipient_email: reservation.guest_email,
      email_type: sendOrigin === "auto" ? "pre_arrival_reminder" : "pre_arrival_link",
      subject: c.subject,
      status: "sent",
      sent_at: now,
      resend_id: emailData.id || null,
    });

    // Auditoria reaproveitando o registro de atividades existente
    await supabase.from("activity_log").insert({
      user_email: sendOrigin === "auto" ? "system" : "admin_panel",
      action: sendOrigin === "auto" ? "pre_arrival_reminder_sent" : "pre_arrival_sent_manual",
      description:
        sendOrigin === "auto"
          ? "Lembrete de Pre-Chegada enviado automaticamente"
          : "Formulario de Pre-Chegada enviado manualmente pelo painel",
      entity_type: "pre_arrival_responses",
      entity_id: reservationId,
      metadata: { origin: sendOrigin, language: lang, recipient: reservation.guest_email },
    });


    return new Response(JSON.stringify({ success: true, link }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-pre-arrival-email error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
