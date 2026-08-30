// fnrh-criar-reserva — abre a ficha na FNRH (POST /hospedagem/registrar)
// a partir de uma reserva já existente no banco local.
// Falha na FNRH não trava a reserva: grava ERRO_SINCRONIZACAO para reprocessar depois.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { getFnrhEnv, toErrorBody, FnrhError } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse, serviceClient } from "../_shared/internal.ts";
import {
  RESERVATION_FIELDS,
  registrarHospedagem,
  saveSyncError,
  saveSyncSuccess,
  validateForFnrh,
  enrichReservationFromGuestForms,
  type ReservationRow,
} from "../_shared/fnrh-reserva.ts";

const BodySchema = z.object({
  reservation_id: z.string().uuid(),
  // Campos complementares opcionais que a recepção pode informar na hora
  hospede: z
    .object({
      documento_tipo: z.enum(["CPF", "PASSAPORTE"]).optional(),
      cpf: z.string().max(20).optional(),
      passport: z.string().max(40).optional(),
      birth_date: z.string().max(10).optional(),
      nationality: z.string().max(60).optional(),
      genero: z.string().max(30).optional(),
      guest_email: z.string().email().optional(),
      guest_phone: z.string().max(30).optional(),
      quantidade_hospede_adulto: z.number().int().min(1).max(20).optional(),
      quantidade_hospede_menor: z.number().int().min(0).max(20).optional(),
    })
    .optional(),
  force: z.boolean().optional(),
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
    const { reservation_id, hospede, force } = parsed.data;
    const admin = serviceClient();

    // Atualiza campos complementares informados antes de montar o payload
    if (hospede && Object.keys(hospede).length > 0) {
      await admin.from("reservations").update(hospede).eq("id", reservation_id);
    }

    const { data: reservation, error } = await admin
      .from("reservations")
      .select(RESERVATION_FIELDS)
      .eq("id", reservation_id)
      .maybeSingle();

    if (error) throw new FnrhError(500, "ERRO_BANCO", error.message);
    if (!reservation) {
      return jsonResponse({ error: "Reserva não encontrada.", code: "NAO_ENCONTRADA" }, 404);
    }

    let current = reservation as unknown as ReservationRow & {
      reserva_id_fnrh: string | null;
      link_precheckin: string | null;
      situacao_fnrh: string | null;
    };

    if (current.reserva_id_fnrh && !force) {
      return jsonResponse({
        env: getFnrhEnv(),
        already_synced: true,
        situacao_fnrh: current.situacao_fnrh,
        link_precheckin: current.link_precheckin,
      });
    }

    // Aproveita dados já informados pelo hóspede no check-in digital
    current = {
      ...current,
      ...(await enrichReservationFromGuestForms(admin, current)),
    };

    const issues = validateForFnrh(current);
    if (issues.length > 0) {
      await admin
        .from("reservations")
        .update({
          situacao_fnrh: "DADOS_INCOMPLETOS",
          erro_sincronizacao_fnrh: `Dados obrigatórios ausentes: ${issues
            .map((i) => i.message)
            .join(" ")}`.slice(0, 1000),
        })
        .eq("id", reservation_id);

      return jsonResponse(
        {
          error: "Dados incompletos para abrir a ficha na FNRH.",
          code: "VALIDACAO_FNRH",
          details: issues,
        },
        400,
      );
    }


    try {
      const result = await registrarHospedagem(current);
      await saveSyncSuccess(admin, reservation_id, result);
      return jsonResponse({
        env: getFnrhEnv(),
        situacao_fnrh: result.situacao_fnrh,
        link_precheckin: result.link_precheckin,
        reserva_id_fnrh: result.reserva_id_fnrh,
        hospede_id_fnrh: result.hospede_id_fnrh,
      });
    } catch (fnrhError) {
      const { status, body } = toErrorBody(fnrhError);
      await saveSyncError(admin, reservation_id, String(body.error ?? "Erro desconhecido"));
      return jsonResponse(
        { ...body, env: getFnrhEnv(), situacao_fnrh: "ERRO_SINCRONIZACAO", reserva_salva_localmente: true },
        status,
      );
    }
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
