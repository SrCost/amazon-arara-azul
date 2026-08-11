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

/**
 * Valida o JWT do chamador e garante que ele tenha papel administrativo.
 * Retorna null quando não autorizado.
 */
export async function requireInternalUser(req: Request): Promise<InternalUser | null> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const admin = serviceClient();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) return null;

  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const allowed = ["admin", "super_admin"];
  const role = (roles || []).map((r) => r.role as string).find((r) => allowed.includes(r));
  if (!role) return null;

  return { id: userData.user.id, email: userData.user.email ?? null, role };
}
