// fnrh-reprocessar-reserva — tenta novamente reservas com ERRO_SINCRONIZACAO.
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
  reservation_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) return unauthorizedResponse(reason);

    const raw = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Parâmetros inválidos", code: "VALIDACAO", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }
    const { reservation_id, limit } = parsed.data;
    const admin = serviceClient();

    let query = admin.from("reservations").select(RESERVATION_FIELDS);
    if (reservation_id) {
      query = query.eq("id", reservation_id);
    } else {
      query = query.eq("situacao_fnrh", "ERRO_SINCRONIZACAO").limit(limit ?? 5);
    }

    const { data: rows, error } = await query;
    if (error) throw new FnrhError(500, "ERRO_BANCO", error.message);
    if (!rows || rows.length === 0) {
      return jsonResponse({ env: getFnrhEnv(), processadas: 0, resultados: [] });
    }

    const resultados: Array<Record<string, unknown>> = [];

    for (let row of rows as unknown as Array<ReservationRow & { reserva_id_fnrh: string | null }>) {
      if (row.reserva_id_fnrh) {
        resultados.push({ reservation_id: row.id, status: "ja_sincronizada" });
        continue;
      }

      row = { ...row, ...(await enrichReservationFromGuestForms(admin, row)) };
      const issues = validateForFnrh(row);
      if (issues.length > 0) {
        await saveSyncError(admin, row.id, issues.map((i) => `${i.field}: ${i.message}`).join("; "));
        resultados.push({ reservation_id: row.id, status: "dados_incompletos", details: issues });
        continue;
      }

      try {
        const result = await registrarHospedagem(row);
        await saveSyncSuccess(admin, row.id, result);
        resultados.push({
          reservation_id: row.id,
          status: "sincronizada",
          situacao_fnrh: result.situacao_fnrh,
          link_precheckin: result.link_precheckin,
        });
      } catch (fnrhError) {
        const { body } = toErrorBody(fnrhError);
        await saveSyncError(admin, row.id, String(body.error ?? "Erro desconhecido"));
        resultados.push({ reservation_id: row.id, status: "erro", error: body.error, code: body.code });
      }
    }

    return jsonResponse({ env: getFnrhEnv(), processadas: resultados.length, resultados });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
