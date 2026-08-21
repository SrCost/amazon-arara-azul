// fnrh-hospedes — detalhe, pré-check-ins e ações individuais de hóspede na FNRH v2.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getFnrhEnv, toErrorBody } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";
import {
  DateSchema,
  DateTimeSchema,
  DocumentAlphanumSchema,
  cleanQuery,
  toIsoUtc,
} from "../_shared/fnrh-format.ts";

const BodySchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("detalhe"), id: z.string().min(1).max(60) }),
  z.object({
    acao: z.literal("pre_checkins"),
    exibir_vinculado: z.boolean().optional(),
    data_inicio: DateSchema.optional(),
    data_fim: DateSchema.optional(),
    tipo_documento: z.string().max(30).optional(),
    numero_documento: DocumentAlphanumSchema.optional(),
  }),
  z.object({
    acao: z.literal("checkin"),
    hospede_id: z.string().min(1).max(60),
    data_hora: DateTimeSchema.optional(),
  }),
  z.object({
    acao: z.literal("checkout"),
    hospede_id: z.string().min(1).max(60),
    data_hora: DateTimeSchema.optional(),
  }),
  z.object({
    acao: z.literal("no_show"),
    hospede_id: z.string().min(1).max(60),
    data_hora: DateTimeSchema.optional(),
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

    if (p.acao === "detalhe") {
      const data = await fnrhFetch({ method: "GET", path: `/hospedes/${p.id}`, timeoutMs: 25000 });
      return jsonResponse({ env, data });
    }

    if (p.acao === "pre_checkins") {
      const data = await fnrhFetch({
        method: "GET",
        path: "/hospedes/pre-checkins",
        query: cleanQuery({
          exibir_vinculado: p.exibir_vinculado,
          data_inicio: p.data_inicio,
          data_fim: p.data_fim,
          tipo_documento: p.tipo_documento,
          numero_documento: p.numero_documento,
        }),
        timeoutMs: 25000,
      });
      return jsonResponse({ env, data });
    }

    const dataHora = p.data_hora ?? toIsoUtc();
    const path =
      p.acao === "no_show" ? `/hospedes/${p.hospede_id}/no-show` : `/hospedes/${p.hospede_id}/${p.acao}`;
    const bodyKey =
      p.acao === "checkin" ? "dataHoraCheckin" : p.acao === "checkout" ? "dataHoraCheckout" : "dataHoraNoShow";

    const data = await fnrhFetch({
      method: "PATCH",
      path,
      body: { [bodyKey]: dataHora },
      timeoutMs: 25000,
    });
    return jsonResponse({ env, acao: p.acao, data_hora: dataHora, data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
