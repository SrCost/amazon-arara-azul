// fnrh-client — proxy seguro para a API FNRH v2.
// O frontend nunca fala com a FNRH direto: sempre passa por aqui.
// Somente usuários internos autenticados (admin/super_admin) podem usar.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getFnrhEnv, getCpfSolicitante, toErrorBody } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";

const BodySchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  path: z.string().min(1).max(300),
  query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.unknown().optional(),
  include_cpf_solicitante: z.boolean().optional(),
  timeout_ms: z.number().int().min(1000).max(60000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) {
      return unauthorizedResponse(reason);
    }


    // GET simples: devolve o ambiente atual (para o indicador do painel)
    if (req.method === "GET") {
      return jsonResponse({ env: getFnrhEnv() });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse(
        { error: "Parâmetros inválidos", code: "VALIDACAO", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    const { method, path, query, body, include_cpf_solicitante, timeout_ms } = parsed.data;

    const headers: Record<string, string> = {};
    if (include_cpf_solicitante) {
      const cpf = getCpfSolicitante();
      if (!cpf) {
        return jsonResponse(
          { error: "FNRH_CPF_SOLICITANTE não configurado no backend.", code: "CONFIG_AUSENTE" },
          500,
        );
      }
      headers["cpf_solicitante"] = cpf;
    }

    const data = await fnrhFetch({
      method,
      path,
      query,
      body,
      headers,
      timeoutMs: timeout_ms,
    });

    return jsonResponse({ env: getFnrhEnv(), data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
