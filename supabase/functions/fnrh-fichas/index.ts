// fnrh-fichas — GET /fichas na API FNRH v2 com paginação e filtros.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getFnrhEnv, toErrorBody } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";
import {
  DateSchema,
  DocumentAlphanumSchema,
  PageNumberSchema,
  PageSizeSchema,
  cleanQuery,
} from "../_shared/fnrh-format.ts";

const FiltersSchema = z.object({
  status: z.string().max(40).optional(),
  tipo_documento: z.string().max(30).optional(),
  numero_documento: DocumentAlphanumSchema.optional(),
  data_inicial: DateSchema.optional(),
  data_final: DateSchema.optional(),
  page_number: PageNumberSchema.optional(),
  page_size: PageSizeSchema.optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) return unauthorizedResponse(reason);

    const url = new URL(req.url);
    const raw: Record<string, unknown> = Object.fromEntries(url.searchParams.entries());
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      Object.assign(raw, body ?? {});
    }
    for (const key of Object.keys(raw)) {
      if (raw[key] === "" || raw[key] === null) delete raw[key];
    }

    const parsed = FiltersSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Filtros inválidos", code: "VALIDACAO", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }
    const p = parsed.data;

    const data = await fnrhFetch({
      method: "GET",
      path: "/fichas",
      query: cleanQuery({
        status: p.status,
        tipo_documento: p.tipo_documento,
        numero_documento: p.numero_documento,
        data_inicial: p.data_inicial,
        data_final: p.data_final,
        page_number: p.page_number ?? 1,
        page_size: p.page_size ?? 20,
      }),
      timeoutMs: 25000,
    });

    return jsonResponse({ env: getFnrhEnv(), data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
