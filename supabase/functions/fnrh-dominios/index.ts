// fnrh-dominios — domínios (listas) da FNRH com cache em memória de 24h.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getFnrhEnv, toErrorBody } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, requireInternalUser } from "../_shared/internal.ts";

const PATHS: Record<string, string> = {
  transporte: "/dominios/meios-transporte",
  motivo_viagem: "/dominios/motivos-viagem",
  genero: "/dominios/generos",
  raca: "/dominios/racas",
  deficiencia: "/dominios/deficiencias",
  tipo_deficiencia: "/dominios/tipos-deficiencia",
  tipo_documento: "/dominios/tipos-documento",
};

const TipoSchema = z.enum([
  "transporte",
  "motivo_viagem",
  "genero",
  "raca",
  "deficiencia",
  "tipo_deficiencia",
  "tipo_documento",
]);

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown }>();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await requireInternalUser(req);
    if (!user) return jsonResponse({ error: "Não autorizado", code: "NAO_AUTORIZADO" }, 401);

    const url = new URL(req.url);
    let tipo = url.searchParams.get("tipo");
    if (!tipo && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      tipo = (body as Record<string, string>)?.tipo ?? null;
    }

    const parsed = TipoSchema.safeParse(tipo);
    if (!parsed.success) {
      return jsonResponse(
        { error: `Parâmetro "tipo" inválido. Use: ${Object.keys(PATHS).join(", ")}.`, code: "VALIDACAO" },
        400,
      );
    }

    const env = getFnrhEnv();
    const key = `${env}:${parsed.data}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return jsonResponse({ env, tipo: parsed.data, cached: true, data: hit.data });
    }

    const data = await fnrhFetch({ method: "GET", path: PATHS[parsed.data], timeoutMs: 20000 });
    cache.set(key, { at: Date.now(), data });

    return jsonResponse({ env, tipo: parsed.data, cached: false, data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
