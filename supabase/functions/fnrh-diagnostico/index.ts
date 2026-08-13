// fnrh-diagnostico — testa usuário/senha da FNRH e devolve status detalhado.
// NUNCA expõe credenciais: apenas metadados de forma (comprimento, espaços).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";
import { getFnrhEnv } from "../_shared/fnrh.ts";

const BASE_URLS = {
  homologacao: "https://homlowcode.serpro.gov.br/FNRH_API/rest/v2",
  producao: "https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v2",
} as const;

type Env = keyof typeof BASE_URLS;

type Veredito =
  | "OK"
  | "CREDENCIAL_RECUSADA"
  | "SEM_PERMISSAO"
  | "INDISPONIVEL"
  | "TIMEOUT"
  | "CREDENCIAIS_AUSENTES"
  | "ERRO";

interface TesteResultado {
  env: Env;
  base_url: string;
  http_status: number | null;
  duration_ms: number;
  veredito: Veredito;
  mensagem: string;
  api_mensagem: string | null;
  /** Corpo completo devolvido pela API oficial (truncado), para diagnóstico. */
  resposta_completa?: string | null;
  /** true/false quando o chamador envia base64_esperado; nunca devolve o Base64 real. */
  base64_confere?: boolean | null;
}


function extractMessage(raw: string): string | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const direct = p.mensagem ?? p.message ?? p.erro ?? p.error ?? p.detail;
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  } catch {
    // texto puro
  }
  return raw.trim().slice(0, 300) || null;
}

function veredictFor(status: number): { veredito: Veredito; mensagem: string } {
  if (status === 400 || status === 422 || (status >= 200 && status < 300)) {
    return {
      veredito: "OK",
      mensagem:
        "Credenciais aceitas pela API oficial (a recusa foi apenas de dados do teste, não de autenticação).",
    };
  }
  if (status === 401) {
    return {
      veredito: "CREDENCIAL_RECUSADA",
      mensagem:
        "A FNRH recusou usuário/senha (401 - \"Usuário ou senha inválidos\"). Confirme se é a senha de API e se o usuário está habilitado neste ambiente.",
    };
  }
  if (status === 403) {
    return {
      veredito: "SEM_PERMISSAO",
      mensagem: "Autenticação aceita, mas sem permissão (403). Verifique o CPF do solicitante vinculado ao CADASTUR.",
    };
  }
  if (status >= 500) {
    return { veredito: "INDISPONIVEL", mensagem: `API oficial retornou erro interno (HTTP ${status}).` };
  }
  return { veredito: "ERRO", mensagem: `Resposta inesperada da API oficial (HTTP ${status}).` };
}

async function testarEnv(
  env: Env,
  user: string,
  password: string,
  cpfSolicitante: string,
  base64Esperado?: string,
): Promise<TesteResultado> {
  const baseUrl = BASE_URLS[env];
  // Endpoint que efetivamente valida o Basic Auth (um POST vazio: 401 = credencial recusada,
  // 400/422 = credencial aceita e apenas o corpo de teste foi rejeitado).
  const url = `${baseUrl}/hospedagem/registrar`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const startedAt = Date.now();
  const base64 = btoa(`${user}:${password}`);
  const base64Confere = base64Esperado ? base64 === base64Esperado.trim() : null;

  try {
    const headers: Record<string, string> = {
      Authorization: `Basic ${base64}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (cpfSolicitante) headers["cpf_solicitante"] = cpfSolicitante;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: "{}",
      signal: controller.signal,
    });

    const raw = await response.text();
    const duration = Date.now() - startedAt;
    const { veredito, mensagem } = veredictFor(response.status);

    console.log(
      JSON.stringify({
        scope: "fnrh-diagnostico",
        env,
        status: response.status,
        duration_ms: duration,
        veredito,
        // Diagnóstico sem revelar segredos: apenas forma e conferência do Base64.
        base64_len: base64.length,
        base64_confere: base64Confere,
        cpf_solicitante_enviado: Boolean(cpfSolicitante),
        resposta_oficial: raw.slice(0, 1000),
        timestamp: new Date().toISOString(),
      }),
    );

    return {
      env,
      base_url: baseUrl,
      http_status: response.status,
      duration_ms: duration,
      veredito,
      mensagem,
      api_mensagem: response.ok ? null : extractMessage(raw),
      resposta_completa: raw ? raw.slice(0, 1000) : null,
      base64_confere: base64Confere,
    };

  } catch (error) {
    const aborted = (error as Error)?.name === "AbortError";
    const duration = Date.now() - startedAt;
    console.log(
      JSON.stringify({
        scope: "fnrh-diagnostico",
        env,
        status: aborted ? "timeout" : "network_error",
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      }),
    );
    return {
      env,
      base_url: baseUrl,
      http_status: null,
      duration_ms: duration,
      veredito: aborted ? "TIMEOUT" : "INDISPONIVEL",
      mensagem: aborted
        ? "A API oficial não respondeu em 15s."
        : "Não foi possível conectar à API oficial (rede/DNS/TLS).",
      api_mensagem: aborted ? null : ((error as Error)?.message ?? null),
    };
  } finally {
    clearTimeout(timer);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user: authUser, reason } = await getInternalAuth(req);
    if (!authUser) return unauthorizedResponse(reason);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const compararAmbientes = Boolean((body as Record<string, unknown>)?.comparar_ambientes);
    const base64Esperado = typeof (body as Record<string, unknown>)?.base64_esperado === "string"
      ? String((body as Record<string, unknown>).base64_esperado)
      : undefined;


    const rawUser = Deno.env.get("FNRH_API_USER") ?? "";
    const rawPassword = Deno.env.get("FNRH_API_PASSWORD") ?? "";
    const rawCpf = Deno.env.get("FNRH_CPF_SOLICITANTE") ?? "";

    const credenciais = {
      usuario_configurado: rawUser.trim().length > 0,
      senha_configurada: rawPassword.trim().length > 0,
      usuario_tamanho: rawUser.trim().length,
      senha_tamanho: rawPassword.trim().length,
      usuario_com_espacos: rawUser !== rawUser.trim(),
      senha_com_espacos: rawPassword !== rawPassword.trim(),
      contem_quebra_de_linha: /[\r\n]/.test(rawUser) || /[\r\n]/.test(rawPassword),
      cpf_solicitante_configurado: rawCpf.replace(/\D/g, "").length > 0,
      cpf_solicitante_valido: rawCpf.replace(/\D/g, "").length === 11,
    };

    const envAtual = getFnrhEnv() as Env;

    if (!credenciais.usuario_configurado || !credenciais.senha_configurada) {
      return jsonResponse({
        env: envAtual,
        credenciais,
        testes: [
          {
            env: envAtual,
            base_url: BASE_URLS[envAtual],
            http_status: null,
            duration_ms: 0,
            veredito: "CREDENCIAIS_AUSENTES" as Veredito,
            mensagem: "Usuário e/ou senha da FNRH não estão configurados no backend.",
            api_mensagem: null,
          },
        ],
      });
    }

    const user = rawUser.trim();
    const password = rawPassword.trim();

    const envs: Env[] = compararAmbientes
      ? (["producao", "homologacao"] as Env[])
      : [envAtual];

    const testes: TesteResultado[] = [];
    for (const env of envs) {
      testes.push(await testarEnv(env, user, password, rawCpf.replace(/\D/g, ""), base64Esperado));
    }


    return jsonResponse({ env: envAtual, credenciais, testes, testado_em: new Date().toISOString() });
  } catch (error) {
    return jsonResponse(
      { error: (error as Error)?.message || "Erro interno no diagnóstico", code: "ERRO_INTERNO" },
      500,
    );
  }
});
