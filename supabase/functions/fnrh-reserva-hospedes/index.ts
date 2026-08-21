// fnrh-reserva-hospedes — hóspedes de uma reserva e ações em lote na FNRH v2.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getCpfSolicitante, getFnrhEnv, toErrorBody, FnrhError } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";
import { DateTimeSchema, toIsoUtc } from "../_shared/fnrh-format.ts";

const BodySchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("listar"), reserva_id: z.string().min(1).max(60) }),
  z.object({
    acao: z.literal("adicionar"),
    reserva_id: z.string().min(1).max(60),
    hospede: z.record(z.unknown()),
  }),
  z.object({
    acao: z.literal("checkin"),
    reserva_id: z.string().min(1).max(60),
    data_hora: DateTimeSchema.optional(),
    hospedes_ids: z.array(z.string().min(1).max(60)).max(50).optional(),
  }),
  z.object({
    acao: z.literal("checkout"),
    reserva_id: z.string().min(1).max(60),
    data_hora: DateTimeSchema.optional(),
    hospedes_ids: z.array(z.string().min(1).max(60)).max(50).optional(),
  }),
  z.object({
    acao: z.literal("noshow"),
    reserva_id: z.string().min(1).max(60),
    data_hora: DateTimeSchema.optional(),
    hospedes_ids: z.array(z.string().min(1).max(60)).max(50).optional(),
  }),
  z.object({
    acao: z.literal("vincular"),
    reserva_id: z.string().min(1).max(60),
    hospede_id: z.string().min(1).max(60),
  }),
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) return unauthorizedResponse(reason);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonResponse(
        { error: "Parâmetros inválidos", code: "VALIDACAO", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    const env = getFnrhEnv();
    const p = parsed.data;
    const base = `/reservas/${p.reserva_id}`;

    if (p.acao === "listar") {
      const data = await fnrhFetch({ method: "GET", path: `${base}/hospedes`, timeoutMs: 25000 });
      return jsonResponse({ env, data });
    }

    if (p.acao === "adicionar") {
      const cpf = await getCpfSolicitante();
      if (!cpf) throw new FnrhError(500, "CONFIG_AUSENTE", "CPF do solicitante não configurado.");
      const data = await fnrhFetch({
        method: "POST",
        path: `${base}/hospedes`,
        body: p.hospede,
        headers: { cpf_solicitante: cpf },
        timeoutMs: 30000,
      });
      return jsonResponse({ env, data });
    }

    if (p.acao === "vincular") {
      const data = await fnrhFetch({
        method: "POST",
        path: `${base}/vincular-hospede/${p.hospede_id}`,
        timeoutMs: 25000,
      });
      return jsonResponse({ env, data });
    }

    // Ações em lote: checkin / checkout / noshow
    const dataHora = p.data_hora ?? toIsoUtc();
    const bodyKey =
      p.acao === "checkin" ? "dataHoraCheckin" : p.acao === "checkout" ? "dataHoraCheckout" : "dataHoraNoShow";
    const data = await fnrhFetch({
      method: "POST",
      path: `${base}/${p.acao}`,
      body: { [bodyKey]: dataHora, ...(p.hospedes_ids?.length ? { hospedes: p.hospedes_ids } : {}) },
      timeoutMs: 30000,
    });
    return jsonResponse({ env, acao: p.acao, data_hora: dataHora, data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
