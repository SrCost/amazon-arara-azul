// fnrh-credenciais — painel admin: consultar status, salvar e testar as credenciais da FNRH.
// Os valores NUNCA são devolvidos ao cliente; apenas metadados (tamanhos, datas, vereditos).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  corsHeaders,
  jsonResponse,
  getInternalAuth,
  unauthorizedResponse,
  serviceClient,
} from "../_shared/internal.ts";
import { getFnrhCredentials, clearFnrhCredentialsCache } from "../_shared/fnrh.ts";

const BASE_URLS = {
  producao: "https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v2",
  homologacao: "https://hom-lowcode.serpro.gov.br/FNRH_API/rest/v2",
} as const;

type Env = keyof typeof BASE_URLS;

const noSpaces = (label: string) => (v: string) =>
  !/\s/.test(v) || `${label} não pode conter espaços ou quebras de linha.`;

const credenciaisSchema = z.object({
  api_user: z
    .string()
    .trim()
    .min(3, "O usuário deve ter ao menos 3 caracteres.")
    .max(200, "O usuário deve ter no máximo 200 caracteres.")
    .refine((v) => !/\s/.test(v), "O usuário não pode conter espaços ou quebras de linha.")
    .refine((v) => !v.includes(":"), "O usuário não pode conter ':' (usado no Basic Auth)."),
  api_password: z
    .string()
    .trim()
    .min(6, "A senha/chave deve ter ao menos 6 caracteres.")
    .max(500, "A senha/chave deve ter no máximo 500 caracteres.")
    .refine((v) => !/\s/.test(v), "A senha/chave não pode conter espaços ou quebras de linha."),
  cpf_solicitante: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11, "O CPF do solicitante deve ter 11 dígitos.")
    .refine(cpfValido, "CPF do solicitante inválido (dígito verificador)."),
});

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

type Veredito =
  | "OK"
  | "CREDENCIAL_RECUSADA"
  | "SEM_PERMISSAO"
  | "INDISPONIVEL"
  | "TIMEOUT"
  | "CREDENCIAIS_AUSENTES"
  | "ERRO";

function veredictFor(status: number): { veredito: Veredito; mensagem: string } {
  if (status === 400 || status === 422 || (status >= 200 && status < 300)) {
    return {
      veredito: "OK",
      mensagem:
        "Credenciais aceitas pela API oficial (a recusa foi apenas dos dados de teste, não da autenticação).",
    };
  }
  if (status === 401) {
    return {
      veredito: "CREDENCIAL_RECUSADA",
      mensagem:
        'A FNRH recusou usuário/senha (401 — "Usuário ou senha inválidos"). Confirme se é a senha de API e se o usuário está habilitado em produção.',
    };
  }
  if (status === 403) {
    return {
      veredito: "SEM_PERMISSAO",
      mensagem:
        "Autenticação aceita, mas sem permissão (403). Verifique o CPF do solicitante vinculado ao CADASTUR.",
    };
  }
  if (status >= 500) {
    return { veredito: "INDISPONIVEL", mensagem: `A API oficial retornou erro interno (HTTP ${status}).` };
  }
  return { veredito: "ERRO", mensagem: `Resposta inesperada da API oficial (HTTP ${status}).` };
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

async function testar(env: Env, user: string, password: string, cpf: string) {
  const url = `${BASE_URLS[env]}/hospedagem/registrar`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const startedAt = Date.now();

  try {
    const headers: Record<string, string> = {
      Authorization: `Basic ${btoa(`${user}:${password}`)}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (cpf) headers["cpf_solicitante"] = cpf;

    const response = await fetch(url, { method: "POST", headers, body: "{}", signal: controller.signal });
    const raw = await response.text();
    const duration_ms = Date.now() - startedAt;
    const { veredito, mensagem } = veredictFor(response.status);

    console.log(
      JSON.stringify({
        scope: "fnrh-credenciais",
        acao: "testar",
        env,
        status: response.status,
        duration_ms,
        veredito,
        timestamp: new Date().toISOString(),
      }),
    );

    return {
      env,
      base_url: BASE_URLS[env],
      http_status: response.status,
      duration_ms,
      veredito,
      mensagem,
      api_mensagem: response.ok ? null : extractMessage(raw),
    };
  } catch (error) {
    const aborted = (error as Error)?.name === "AbortError";
    return {
      env,
      base_url: BASE_URLS[env],
      http_status: null,
      duration_ms: Date.now() - startedAt,
      veredito: (aborted ? "TIMEOUT" : "INDISPONIVEL") as Veredito,
      mensagem: aborted
        ? "A API oficial não respondeu em 15s."
        : "Não foi possível conectar à API oficial (rede/DNS/TLS).",
      api_mensagem: aborted ? null : ((error as Error)?.message ?? null),
    };
  } finally {
    clearTimeout(timer);
  }
}

function metadados(creds: { user: string; password: string; cpfSolicitante: string; origem: string; updatedAt?: string | null; updatedByEmail?: string | null }) {
  return {
    configurado: Boolean(creds.user && creds.password),
    origem: creds.origem,
    usuario_tamanho: creds.user.length,
    senha_tamanho: creds.password.length,
    usuario_com_espacos: /\s/.test(creds.user),
    senha_com_espacos: /\s/.test(creds.password),
    cpf_solicitante_configurado: creds.cpfSolicitante.length > 0,
    cpf_solicitante_valido: cpfValido(creds.cpfSolicitante),
    atualizado_em: creds.updatedAt ?? null,
    atualizado_por: creds.updatedByEmail ?? null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user: authUser, reason } = await getInternalAuth(req);
    if (!authUser) return unauthorizedResponse(reason);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const acao = String(body.acao || "status");
    const env: Env = "producao";

    if (acao === "status") {
      const creds = await getFnrhCredentials();
      return jsonResponse({ env, base_url: BASE_URLS[env], credenciais: metadados(creds) });
    }

    if (acao === "testar" || acao === "salvar") {
      const enviouValores =
        typeof body.api_user === "string" || typeof body.api_password === "string";

      let user: string;
      let password: string;
      let cpf: string;

      if (acao === "salvar" || enviouValores) {
        const parsed = credenciaisSchema.safeParse({
          api_user: body.api_user ?? "",
          api_password: body.api_password ?? "",
          cpf_solicitante: body.cpf_solicitante ?? "",
        });
        if (!parsed.success) {
          return jsonResponse(
            { error: "Dados inválidos.", code: "VALIDACAO", campos: parsed.error.flatten().fieldErrors },
            400,
          );
        }
        user = parsed.data.api_user;
        password = parsed.data.api_password;
        cpf = parsed.data.cpf_solicitante;
      } else {
        const atuais = await getFnrhCredentials();
        if (!atuais.user || !atuais.password) {
          return jsonResponse(
            {
              env,
              credenciais: metadados(atuais),
              teste: {
                env,
                base_url: BASE_URLS[env],
                http_status: null,
                duration_ms: 0,
                veredito: "CREDENCIAIS_AUSENTES" as Veredito,
                mensagem: "Nenhuma credencial da FNRH está configurada.",
                api_mensagem: null,
              },
            },
            200,
          );
        }
        user = atuais.user;
        password = atuais.password;
        cpf = atuais.cpfSolicitante;
      }

      if (acao === "salvar") {
        const admin = serviceClient();
        const { error } = await admin.from("fnrh_credentials").upsert(
          {
            id: "default",
            api_user: user,
            api_password: password,
            cpf_solicitante: cpf,
            env,
            updated_at: new Date().toISOString(),
            updated_by: authUser.id,
            updated_by_email: authUser.email,
          },
          { onConflict: "id" },
        );
        if (error) {
          console.log(JSON.stringify({ scope: "fnrh-credenciais", acao: "salvar", erro: error.message }));
          return jsonResponse({ error: "Não foi possível salvar as credenciais.", code: "ERRO_SALVAR" }, 500);
        }
        clearFnrhCredentialsCache();
        await admin.from("activity_log").insert({
          user_id: authUser.id,
          user_email: authUser.email ?? "admin",
          action: "update",
          description: "Credenciais da FNRH (produção) atualizadas pelo painel",
          entity_type: "fnrh_credentials",
          metadata: { env, usuario_tamanho: user.length, senha_tamanho: password.length },
        });
      }

      const teste = await testar(env, user, password, cpf);
      const creds = await getFnrhCredentials();
      return jsonResponse({
        env,
        salvo: acao === "salvar",
        credenciais: metadados(creds),
        teste,
        testado_em: new Date().toISOString(),
      });
    }

    return jsonResponse({ error: "Ação inválida.", code: "ACAO_INVALIDA" }, 400);
  } catch (error) {
    return jsonResponse(
      { error: (error as Error)?.message || "Erro interno", code: "ERRO_INTERNO" },
      500,
    );
  }
});
