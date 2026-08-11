// Cliente HTTP interno para a API FNRH v2 (SERPRO / Ministério do Turismo).
// NUNCA expor credenciais: usuário/senha vivem apenas em secrets do backend.

const BASE_URLS = {
  homologacao: "https://homlowcode.serpro.gov.br/FNRH_API/rest/v2",
  producao: "https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v2",
} as const;

export type FnrhEnv = keyof typeof BASE_URLS;

export function getFnrhEnv(): FnrhEnv {
  const raw = (Deno.env.get("FNRH_ENV") || "producao").trim().toLowerCase();
  return raw === "producao" ? "producao" : "homologacao";
}

export function getFnrhBaseUrl(): string {
  return BASE_URLS[getFnrhEnv()];
}

export function getCpfSolicitante(): string | null {
  const cpf = Deno.env.get("FNRH_CPF_SOLICITANTE");
  return cpf ? cpf.replace(/\D/g, "") : null;
}

/** Mascara documentos em logs: mantém apenas os 3 últimos caracteres. */
export function maskDoc(value?: string | null): string {
  if (!value) return "";
  const v = String(value);
  if (v.length <= 3) return "***";
  return `***${v.slice(-3)}`;
}

export class FnrhError extends Error {
  status: number;
  code: string;
  details: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "FnrhError";
    this.status = status;
    this.code = code;
    this.details = details ?? null;
  }
}

export interface FnrhRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

function authHeader(): string {
  const user = Deno.env.get("FNRH_API_USER")?.trim();
  const password = Deno.env.get("FNRH_API_PASSWORD")?.trim();
  if (!user || !password) {
    throw new FnrhError(
      500,
      "FNRH_CREDENCIAIS_AUSENTES",
      "Credenciais da FNRH não configuradas no backend (FNRH_API_USER / FNRH_API_PASSWORD).",
    );
  }
  return `Basic ${btoa(`${user}:${password}`)}`;
}

function friendlyMessage(status: number, apiMessage: string | null): string {
  switch (status) {
    case 400:
      return apiMessage
        ? `Dados inválidos para a FNRH: ${apiMessage}`
        : "Dados inválidos para a FNRH (erro de validação). Revise os campos enviados.";
    case 401:
      return "A FNRH recusou as credenciais (401). Verifique usuário/senha e se o ambiente (homologação/produção) está correto.";
    case 403:
      return "Acesso negado pela FNRH (403). Verifique as permissões do usuário e o CPF do solicitante (CADASTUR).";
    case 404:
      return apiMessage || "Recurso não encontrado na FNRH (404).";
    case 409:
      return apiMessage || "Conflito na FNRH (409): registro possivelmente já existe.";
    default:
      if (status >= 500) {
        return "A FNRH está indisponível ou retornou erro interno. Tente novamente mais tarde.";
      }
      return apiMessage || `Erro inesperado da FNRH (HTTP ${status}).`;
  }
}

function extractApiMessage(payload: unknown, fallbackText: string): string | null {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const direct = p.mensagem ?? p.message ?? p.erro ?? p.error ?? p.detail;
    if (typeof direct === "string" && direct.trim()) return direct.trim();
    const list = (p.erros ?? p.errors ?? p.mensagens) as unknown;
    if (Array.isArray(list) && list.length > 0) {
      return list
        .map((item) =>
          typeof item === "string"
            ? item
            : ((item as Record<string, unknown>)?.mensagem as string) ??
              ((item as Record<string, unknown>)?.message as string) ??
              JSON.stringify(item),
        )
        .filter(Boolean)
        .join("; ");
    }
  }
  const text = (fallbackText || "").trim();
  return text ? text.slice(0, 500) : null;
}

/**
 * Executa uma chamada autenticada na API FNRH.
 * Log estruturado por chamada (endpoint, status, duração) — sem segredos.
 */
export async function fnrhFetch<T = unknown>(opts: FnrhRequestOptions): Promise<T> {
  const method = opts.method || "GET";
  const env = getFnrhEnv();
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const url = new URL(`${getFnrhBaseUrl()}${path}`);

  for (const [key, value] of Object.entries(opts.query || {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Authorization: authHeader(),
    Accept: "application/json",
    ...(opts.headers || {}),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 20000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    const rawText = await response.text();
    let payload: unknown = null;
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }

    console.log(
      JSON.stringify({
        scope: "fnrh",
        env,
        method,
        endpoint: path,
        status: response.status,
        duration_ms: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      }),
    );

    if (!response.ok) {
      const apiMessage = extractApiMessage(payload, rawText);
      throw new FnrhError(
        response.status,
        `FNRH_HTTP_${response.status}`,
        friendlyMessage(response.status, apiMessage),
        payload ?? apiMessage,
      );
    }

    return (payload ?? {}) as T;
  } catch (error) {
    if (error instanceof FnrhError) throw error;
    const aborted = (error as Error)?.name === "AbortError";
    console.log(
      JSON.stringify({
        scope: "fnrh",
        env,
        method,
        endpoint: path,
        status: aborted ? "timeout" : "network_error",
        duration_ms: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      }),
    );
    if (aborted) {
      throw new FnrhError(
        504,
        "FNRH_TIMEOUT",
        `A FNRH não respondeu em ${Math.round(timeoutMs / 1000)}s. Tente novamente.`,
      );
    }
    throw new FnrhError(
      502,
      "FNRH_INDISPONIVEL",
      `Não foi possível conectar à API da FNRH no ambiente de ${env}. Verifique a disponibilidade do serviço oficial e tente novamente.`,
      (error as Error)?.message,
    );
  }
}

/** Resposta JSON padronizada de sucesso. */
export function ok(data: unknown, extraHeaders: Record<string, string> = {}) {
  return { data, extraHeaders };
}

/** Converte qualquer erro em corpo de resposta amigável. */
export function toErrorBody(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof FnrhError) {
    return {
      status: error.status >= 400 && error.status < 600 ? error.status : 500,
      body: { error: error.message, code: error.code, details: error.details },
    };
  }
  const message = (error as Error)?.message || "Erro interno";
  return { status: 500, body: { error: message, code: "ERRO_INTERNO" } };
}
