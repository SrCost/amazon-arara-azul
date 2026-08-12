// Helpers compartilhados: CORS, autenticação interna (admin/recepção) e cliente de serviço.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export interface InternalUser {
  id: string;
  email: string | null;
  role: string;
}

export type AuthFailureReason = "SEM_SESSAO" | "SESSAO_EXPIRADA" | "SEM_PERMISSAO";

export interface InternalAuthResult {
  user: InternalUser | null;
  reason?: AuthFailureReason;
}

/**
 * Valida o JWT do chamador e garante que ele tenha papel administrativo,
 * informando o motivo exato da recusa (sem expor tokens nos logs).
 */
export async function getInternalAuth(req: Request): Promise<InternalAuthResult> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("auth: requisição sem cabeçalho Bearer");
    return { user: null, reason: "SEM_SESSAO" };
  }

  const token = authHeader.replace("Bearer ", "");
  const admin = serviceClient();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) {
    console.log("auth: token inválido ou sessão expirada", error?.message ?? "sem usuário");
    return { user: null, reason: "SESSAO_EXPIRADA" };
  }

  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const allowed = ["admin", "super_admin"];
  const role = (roles || []).map((r) => r.role as string).find((r) => allowed.includes(r));
  if (!role) {
    console.log("auth: usuário autenticado sem papel administrativo", userData.user.id);
    return { user: null, reason: "SEM_PERMISSAO" };
  }

  return { user: { id: userData.user.id, email: userData.user.email ?? null, role } };
}

/**
 * Versão simplificada mantida para compatibilidade: retorna null quando não autorizado.
 */
export async function requireInternalUser(req: Request): Promise<InternalUser | null> {
  const { user } = await getInternalAuth(req);
  return user;
}

/** Resposta 401 padronizada com mensagem amigável por motivo. */
export function unauthorizedResponse(reason: AuthFailureReason = "SEM_SESSAO") {
  const messages: Record<AuthFailureReason, string> = {
    SEM_SESSAO: "Sua sessão expirou. Entre novamente para continuar.",
    SESSAO_EXPIRADA: "Sua sessão expirou. Entre novamente para continuar.",
    SEM_PERMISSAO: "Seu usuário não tem permissão administrativa para esta ação.",
  };
  return jsonResponse({ error: messages[reason], code: reason }, reason === "SEM_PERMISSAO" ? 403 : 401);
}

