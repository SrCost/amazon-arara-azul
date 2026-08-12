// fnrh-checkin — PATCH /hospedes/{hospede_id_fnrh}/checkin
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getCpfSolicitante, getFnrhEnv, toErrorBody, FnrhError } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse, serviceClient } from "../_shared/internal.ts";

const BodySchema = z.object({
  reservation_id: z.string().uuid(),
  data_hora: z.string().datetime().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) return unauthorizedResponse(reason);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse(
        { error: "Parâmetros inválidos", code: "VALIDACAO", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }
    const { reservation_id } = parsed.data;
    const dataHora = parsed.data.data_hora ?? new Date().toISOString();

    const admin = serviceClient();
    const { data: reservation, error } = await admin
      .from("reservations")
      .select("id, hospede_id_fnrh, situacao_fnrh")
      .eq("id", reservation_id)
      .maybeSingle();

    if (error) throw new FnrhError(500, "ERRO_BANCO", error.message);
    if (!reservation) return jsonResponse({ error: "Reserva não encontrada.", code: "NAO_ENCONTRADA" }, 404);
    if (!reservation.hospede_id_fnrh) {
      return jsonResponse(
        { error: "Esta reserva ainda não foi sincronizada com a FNRH.", code: "SEM_HOSPEDE_FNRH" },
        409,
      );
    }

    const cpf = getCpfSolicitante();
    if (!cpf) throw new FnrhError(500, "CONFIG_AUSENTE", "FNRH_CPF_SOLICITANTE não configurado.");

    const data = await fnrhFetch({
      method: "PATCH",
      path: `/hospedes/${reservation.hospede_id_fnrh}/checkin`,
      body: { dataHoraCheckin: dataHora },
      headers: { cpf_solicitante: cpf },
      timeoutMs: 25000,
    });

    await admin
      .from("reservations")
      .update({
        situacao_fnrh: "CHECKIN_REALIZADO",
        fnrh_checkin_em: dataHora,
        erro_sincronizacao_fnrh: null,
      })
      .eq("id", reservation_id);

    return jsonResponse({ env: getFnrhEnv(), situacao_fnrh: "CHECKIN_REALIZADO", fnrh_checkin_em: dataHora, data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
