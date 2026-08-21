// fnrh-dominios — domínios (listas de valores fixos) da FNRH com cache de 1h.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { fnrhFetch, getFnrhEnv, toErrorBody } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";

// Caminhos conforme a documentação oficial da API FNRH v2.
const PATHS = {
  meios_transporte: "/dominios/fnrh/meios_transporte",
  motivos_viagem: "/dominios/fnrh/motivos_viagem",
  hospedes_situacoes: "/dominios/hospedes/situacoes",
  generos: "/dominios/pessoas/generos",
  opcao_deficiencia: "/dominios/pessoas/opcao_deficiencia",
  racas: "/dominios/pessoas/racas",
  tipos_deficiencia: "/dominios/pessoas/tipos_deficiencia",
  tipos_documento: "/dominios/pessoas/tipos_documento",
  reservas_situacoes: "/dominios/reservas/situacoes",
  fichas_situacoes: "/dominios/fichas/situacoes",
} as const;

type Tipo = keyof typeof PATHS;

// Aliases mantidos para não quebrar chamadas já existentes no painel.
const ALIASES: Record<string, Tipo> = {
  transporte: "meios_transporte",
  motivo_viagem: "motivos_viagem",
  genero: "generos",
  raca: "racas",
  deficiencia: "opcao_deficiencia",
  tipo_deficiencia: "tipos_deficiencia",
  tipo_documento: "tipos_documento",
  situacao_hospede: "hospedes_situacoes",
  situacao_reserva: "reservas_situacoes",
  situacao_ficha: "fichas_situacoes",
};

const TipoSchema = z.enum(
  [...(Object.keys(PATHS) as Tipo[]), ...Object.keys(ALIASES), "todos"] as [string, ...string[]],
);

const TTL_MS = 60 * 60 * 1000; // 1h — listas estáticas
const cache = new Map<string, { at: number; data: unknown }>();

async function loadDominio(env: string, tipo: Tipo) {
  const key = `${env}:${tipo}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return { data: hit.data, cached: true };
  const data = await fnrhFetch({ method: "GET", path: PATHS[tipo], timeoutMs: 20000 });
  cache.set(key, { at: Date.now(), data });
  return { data, cached: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) return unauthorizedResponse(reason);

    const url = new URL(req.url);
    let tipo = url.searchParams.get("tipo");
    if (!tipo && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      tipo = (body as Record<string, string>)?.tipo ?? null;
    }

    const parsed = TipoSchema.safeParse(tipo);
    if (!parsed.success) {
      return jsonResponse(
        {
          error: `Parâmetro "tipo" inválido. Use: ${Object.keys(PATHS).join(", ")} ou "todos".`,
          code: "VALIDACAO",
        },
        400,
      );
    }

    const env = getFnrhEnv();
    const raw = parsed.data;

    if (raw === "todos") {
      const entries = Object.keys(PATHS) as Tipo[];
      const results = await Promise.all(
        entries.map(async (t) => {
          try {
            const { data } = await loadDominio(env, t);
            return [t, data] as const;
          } catch {
            return [t, null] as const;
          }
        }),
      );
      return jsonResponse({ env, tipo: "todos", dominios: Object.fromEntries(results) });
    }

    const tipoNorm = (ALIASES[raw] ?? raw) as Tipo;
    const { data, cached } = await loadDominio(env, tipoNorm);
    return jsonResponse({ env, tipo: tipoNorm, cached, data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
