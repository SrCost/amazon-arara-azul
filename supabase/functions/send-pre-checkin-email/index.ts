import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOGO_URL = "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/logo-arara-azul.png";

// Link oficial do FNRH (Ministério do Turismo / SERPRO) para pré check-in do hóspede
const FNRH_PRE_CHECKIN_URL =
  "https://fnrh.turismo.serpro.gov.br/FNRH_Hospede/QRCodeFNRH?Source=kOgTUS0AB4fDTiltmIlZiPlP%2bt38psnw%2bMrpE0KZwkQVArNzG0WTZFMRFBRLkymOipZFttu%2bheyc6vhebKSEk3SJkh7vMt%2fhRd0Rpn%2fBNlZRHkaxe8xWygFYDFaQeJCBSP5GuvD5G%2foYtnVBbFkGrg%3d%3d&From=MH";

type Lang = "pt" | "en" | "es" | "fr" | "de";
const SUPPORTED: Lang[] = ["pt", "en", "es", "fr", "de"];
const normalizeLang = (l?: string): Lang => {
  const v = (l || "pt").toLowerCase().split("-")[0] as Lang;
  return SUPPORTED.includes(v) ? v : "pt";
};
const LOCALE_MAP: Record<Lang, string> = {
  pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
};

const I18N: Record<Lang, Record<string, string>> = {
  pt: {
    subject: "Antecipe seu Check-in — Pousada Arara Azul",
    title: "Pré Check-in",
    subtitle: "Agilize sua chegada à Pousada Arara Azul",
    hello: "Olá",
    intro: "Sua reserva está confirmada! Para agilizar sua chegada, você já pode fazer o seu <strong>Pré Check-in</strong>.",
    legal: "O preenchimento da Ficha Nacional de Registro de Hóspedes (FNRH) é uma exigência do <strong>Ministério do Turismo</strong> para todos os meios de hospedagem do Brasil. O formulário é oficial e o preenchimento leva poucos minutos.",
    code: "Código", bungalow: "Bangalô", checkin: "Check-in", checkout: "Check-out",
    cta: "Fazer Pré Check-in",
    note: "Se preferir, você também poderá preencher a ficha na recepção no dia da sua chegada.",
    thanks: "Até breve!",
    team: "Equipe Pousada Arara Azul",
  },
  en: {
    subject: "Complete your Check-in in advance — Pousada Arara Azul",
    title: "Pre Check-in",
    subtitle: "Speed up your arrival at Pousada Arara Azul",
    hello: "Hello",
    intro: "Your booking is confirmed! To speed up your arrival, you can now complete your <strong>Pre Check-in</strong>.",
    legal: "Filling in the National Guest Registration Form (FNRH) is required by the <strong>Brazilian Ministry of Tourism</strong> for all accommodation providers. The form is official and takes just a few minutes.",
    code: "Code", bungalow: "Bungalow", checkin: "Check-in", checkout: "Check-out",
    cta: "Complete Pre Check-in",
    note: "If you prefer, you can also fill in the form at the reception on your arrival day.",
    thanks: "See you soon!",
    team: "Pousada Arara Azul Team",
  },
  es: {
    subject: "Adelanta tu Check-in — Pousada Arara Azul",
    title: "Pre Check-in",
    subtitle: "Agiliza tu llegada a Pousada Arara Azul",
    hello: "Hola",
    intro: "¡Tu reserva está confirmada! Para agilizar tu llegada, ya puedes hacer tu <strong>Pre Check-in</strong>.",
    legal: "Completar la Ficha Nacional de Registro de Huéspedes (FNRH) es una exigencia del <strong>Ministerio de Turismo</strong> de Brasil para todos los alojamientos. El formulario es oficial y toma pocos minutos.",
    code: "Código", bungalow: "Bungaló", checkin: "Check-in", checkout: "Check-out",
    cta: "Hacer Pre Check-in",
    note: "Si lo prefieres, también podrás completar la ficha en la recepción el día de tu llegada.",
    thanks: "¡Hasta pronto!",
    team: "Equipo Pousada Arara Azul",
  },
  fr: {
    subject: "Anticipez votre Check-in — Pousada Arara Azul",
    title: "Pré Check-in",
    subtitle: "Accélérez votre arrivée à la Pousada Arara Azul",
    hello: "Bonjour",
    intro: "Votre réservation est confirmée ! Pour accélérer votre arrivée, vous pouvez dès maintenant effectuer votre <strong>Pré Check-in</strong>.",
    legal: "Le remplissage de la Fiche Nationale d'Enregistrement des Clients (FNRH) est exigé par le <strong>Ministère du Tourisme</strong> du Brésil pour tous les hébergements. Le formulaire est officiel et ne prend que quelques minutes.",
    code: "Code", bungalow: "Bungalow", checkin: "Arrivée", checkout: "Départ",
    cta: "Faire le Pré Check-in",
    note: "Si vous préférez, vous pourrez également remplir la fiche à la réception le jour de votre arrivée.",
    thanks: "À bientôt !",
    team: "Équipe Pousada Arara Azul",
  },
  de: {
    subject: "Erledigen Sie Ihren Check-in vorab — Pousada Arara Azul",
    title: "Vor-Check-in",
    subtitle: "Beschleunigen Sie Ihre Ankunft in der Pousada Arara Azul",
    hello: "Hallo",
    intro: "Ihre Reservierung ist bestätigt! Um Ihre Ankunft zu beschleunigen, können Sie jetzt Ihren <strong>Vor-Check-in</strong> ausführen.",
    legal: "Das Ausfüllen des nationalen Gästemeldeformulars (FNRH) ist eine Vorgabe des <strong>brasilianischen Tourismusministeriums</strong> für alle Unterkünfte. Das Formular ist offiziell und dauert nur wenige Minuten.",
    code: "Code", bungalow: "Bungalow", checkin: "Anreise", checkout: "Abreise",
    cta: "Vor-Check-in ausführen",
    note: "Wenn Sie möchten, können Sie das Formular auch am Anreisetag an der Rezeption ausfüllen.",
    thanks: "Bis bald!",
    team: "Team Pousada Arara Azul",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reservationId } = await req.json();
    if (!reservationId) throw new Error("reservationId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email, room_name, check_in, check_out, guest_language, pre_checkin_email_sent")
      .eq("id", reservationId)
      .single();

    if (rErr || !reservation) throw new Error("Reservation not found");
    if (!reservation.guest_email) throw new Error("Reservation has no guest_email");

    // Trava 1: flag na reserva
    if (reservation.pre_checkin_email_sent) {
      return new Response(
        JSON.stringify({ success: true, skipped: "already_sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trava 2: log de e-mails
    const { data: existingLog } = await supabase
      .from("email_logs")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("email_type", "pre_checkin")
      .maybeSingle();

    if (existingLog) {
      await supabase
        .from("reservations")
        .update({ pre_checkin_email_sent: true })
        .eq("id", reservationId);
      return new Response(
        JSON.stringify({ success: true, skipped: "already_logged" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = normalizeLang(reservation.guest_language);
    const t = I18N[lang];
    const formatDate = (d: string) =>
      new Date(d + "T12:00:00Z").toLocaleDateString(LOCALE_MAP[lang], {
        day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
      });
    const code = `PAA-${String(reservation.id).slice(0, 6).toUpperCase()}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
<tr><td align="center" style="background:linear-gradient(135deg,#0B3A66,#0F6B4D);padding:40px 30px;color:#fff;">
<img src="${LOGO_URL}" width="100" style="border-radius:50%;margin-bottom:16px;" alt="Pousada Arara Azul">
<h1 style="margin:0;font-size:24px;">${t.title}</h1>
<p style="margin:8px 0 0;opacity:0.9;font-size:14px;">${t.subtitle}</p>
</td></tr>
<tr><td style="padding:40px;color:#2D3748;font-size:15px;line-height:1.7;">
<p>${t.hello} <strong>${reservation.guest_name}</strong>,</p>
<p>${t.intro}</p>
<table width="100%" style="background:#F6FBF9;border-radius:12px;border:1px solid #E4EFEA;margin:24px 0;">
<tr><td style="padding:20px;">
<table width="100%">
<tr><td style="padding:6px 0;color:#6B7280;">${t.code}</td><td align="right"><strong>${code}</strong></td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">${t.bungalow}</td><td align="right"><strong>${reservation.room_name || "-"}</strong></td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">${t.checkin}</td><td align="right"><strong>${formatDate(reservation.check_in)}</strong></td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">${t.checkout}</td><td align="right"><strong>${formatDate(reservation.check_out)}</strong></td></tr>
</table></td></tr></table>
<table width="100%" style="background:#FFF9F0;border-radius:12px;border:1px solid #F0E4D0;margin:0 0 24px;">
<tr><td style="padding:18px 22px;">
<p style="margin:0;font-size:13px;color:#5C4A2A;line-height:1.6;">${t.legal}</p>
</td></tr></table>
<table width="100%"><tr><td align="center">
<a href="${FNRH_PRE_CHECKIN_URL}" style="background:#0F6B4D;color:#fff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:16px;">
${t.cta}
</a></td></tr></table>
<p style="margin-top:24px;color:#6B7280;font-size:13px;">${t.note}</p>
<p style="margin-top:24px;">${t.thanks}<br><strong>${t.team}</strong></p>
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
        subject: t.subject,
        html,
      }),
    });

    const emailData = await emailRes.json();

    await supabase.from("email_logs").insert({
      reservation_id: reservationId,
      recipient_email: reservation.guest_email,
      email_type: "pre_checkin",
      subject: t.subject,
      status: emailRes.ok ? "sent" : "error",
      sent_at: emailRes.ok ? new Date().toISOString() : null,
      resend_id: emailData.id || null,
      error_message: emailRes.ok ? null : JSON.stringify(emailData),
    });

    if (emailRes.ok) {
      await supabase
        .from("reservations")
        .update({
          pre_checkin_email_sent: true,
          pre_checkin_email_sent_at: new Date().toISOString(),
        })
        .eq("id", reservationId);
    }

    return new Response(
      JSON.stringify({ success: emailRes.ok, resend_id: emailData.id || null }),
      { status: emailRes.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-pre-checkin-email error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
