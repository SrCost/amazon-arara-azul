import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reservationId, rating, comment, issues } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: reservation } = await supabase
      .from("reservations")
      .select("guest_name, guest_email, room_name, check_in, check_out")
      .eq("id", reservationId)
      .single();

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const html = `
<h2>⚠️ Feedback Negativo Recebido</h2>
<p><strong>Hóspede:</strong> ${reservation?.guest_name || "N/A"} (${reservation?.guest_email || "N/A"})</p>
<p><strong>Bangalô:</strong> ${reservation?.room_name || "N/A"}</p>
<p><strong>Período:</strong> ${reservation?.check_in} — ${reservation?.check_out}</p>
<p><strong>Nota:</strong> ${rating}/5</p>
<p><strong>Comentário:</strong> ${comment || "Nenhum"}</p>
<p><strong>Problemas:</strong> ${issues || "Nenhum"}</p>
<hr>
<p>Este hóspede precisa de atenção da equipe.</p>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Pousada Arara Azul <reservas@pousadararazul.com>",
        to: ["reservas@pousadararazul.com"],
        subject: `⚠️ Feedback Negativo — ${reservation?.guest_name || "Hóspede"} (${rating}/5)`,
        html,
      }),
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
