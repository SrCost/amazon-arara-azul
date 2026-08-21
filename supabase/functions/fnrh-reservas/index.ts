// fnrh-reservas — CRUD e ações de reserva na API FNRH v2.
// Ações: listar, criar, detalhar, atualizar, excluir, cancelar.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getFnrhEnv, toErrorBody } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";
import { DateSchema, PageNumberSchema, PageSizeSchema, cleanQuery } from "../_shared/fnrh-format.ts";

const ReservaPayload = z
  .object({
    codigo_reserva: z.string().min(1).max(60).optional(),
    data_entrada: DateSchema,
    data_saida: DateSchema,
    quantidade_hospede_adulto: z.number().int().min(1).max(50),
    quantidade_hospede_menor: z.number().int().min(0).max(50).default(0),
    observacao: z.string().max(500).optional(),
  })
  .passthrough();

const BodySchema = z.discriminatedUnion("acao", [
  z.object({
    acao: z.literal("listar"),
    situacao: z.string().max(40).optional(),
    codigo_reserva: z.string().max(60).optional(),
    data_entrada: DateSchema.optional(),
    data_saida: DateSchema.optional(),
    page_number: PageNumberSchema.optional(),
    page_size: PageSizeSchema.optional(),
  }),
  z.object({ acao: z.literal("criar"), reserva: ReservaPayload }),
  z.object({ acao: z.literal("detalhe"), id: z.string().min(1).max(60) }),
  z.object({ acao: z.literal("atualizar"), id: z.string().min(1).max(60), reserva: ReservaPayload }),
  z.object({ acao: z.literal("excluir"), id: z.string().min(1).max(60) }),
  z.object({ acao: z.literal("cancelar"), id: z.string().min(1).max(60) }),
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

    switch (p.acao) {
      case "listar": {
        const data = await fnrhFetch({
          method: "GET",
          path: "/reservas",
          query: cleanQuery({
            situacao: p.situacao,
            codigo_reserva: p.codigo_reserva,
            data_entrada: p.data_entrada,
            data_saida: p.data_saida,
            page_number: p.page_number ?? 1,
            page_size: p.page_size ?? 20,
          }),
          timeoutMs: 25000,
        });
        return jsonResponse({ env, data });
      }
      case "criar": {
        const data = await fnrhFetch({ method: "POST", path: "/reservas", body: p.reserva, timeoutMs: 30000 });
        return jsonResponse({ env, data });
      }
      case "detalhe": {
        const data = await fnrhFetch({ method: "GET", path: `/reservas/${p.id}`, timeoutMs: 25000 });
        return jsonResponse({ env, data });
      }
      case "atualizar": {
        // PUT substitui todos os dados da reserva: enviar o objeto completo.
        const data = await fnrhFetch({
          method: "PUT",
          path: `/reservas/${p.id}`,
          body: p.reserva,
          timeoutMs: 30000,
        });
        return jsonResponse({ env, data });
      }
      case "excluir": {
        const data = await fnrhFetch({ method: "DELETE", path: `/reservas/${p.id}`, timeoutMs: 25000 });
        return jsonResponse({ env, data });
      }
      case "cancelar": {
        const data = await fnrhFetch({
          method: "POST",
          path: `/reservas/${p.id}/cancelar`,
          timeoutMs: 25000,
        });
        return jsonResponse({ env, data });
      }
    }
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
