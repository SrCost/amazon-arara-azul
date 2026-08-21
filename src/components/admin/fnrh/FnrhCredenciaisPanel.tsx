import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { validateCPF } from "@/lib/cpfValidator";
import { CheckCircle2, Eye, EyeOff, KeyRound, Plug, Save, ShieldCheck, XCircle } from "lucide-react";

const BASE_URL_PRODUCAO = "https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v2";

const schema = z.object({
  api_user: z
    .string()
    .trim()
    .min(3, "Informe o usuário da API (mínimo 3 caracteres).")
    .max(200, "O usuário deve ter no máximo 200 caracteres.")
    .refine((v) => !/\s/.test(v), "O usuário não pode conter espaços ou quebras de linha.")
    .refine((v) => !v.includes(":"), "O usuário não pode conter ':' (usado no Basic Auth)."),
  api_password: z
    .string()
    .trim()
    .min(6, "Informe a senha/chave da API (mínimo 6 caracteres).")
    .max(500, "A senha/chave deve ter no máximo 500 caracteres.")
    .refine((v) => !/\s/.test(v), "A senha/chave não pode conter espaços ou quebras de linha."),
  cpf_solicitante: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11, "O CPF do solicitante deve ter 11 dígitos.")
    .refine((v) => validateCPF(v), "CPF do solicitante inválido."),
});

interface CredMetadados {
  configurado: boolean;
  origem: string;
  usuario_tamanho: number;
  senha_tamanho: number;
  usuario_com_espacos: boolean;
  senha_com_espacos: boolean;
  cpf_solicitante_configurado: boolean;
  cpf_solicitante_valido: boolean;
  atualizado_em: string | null;
  atualizado_por: string | null;
}

interface TesteResultado {
  env: string;
  base_url: string;
  http_status: number | null;
  duration_ms: number;
  veredito: string;
  mensagem: string;
  api_mensagem: string | null;
}

const VEREDITO_LABEL: Record<string, string> = {
  OK: "Credenciais aceitas",
  CREDENCIAL_RECUSADA: "Credencial recusada",
  SEM_PERMISSAO: "Sem permissão (CADASTUR)",
  INDISPONIVEL: "API indisponível",
  TIMEOUT: "Tempo esgotado",
  CREDENCIAIS_AUSENTES: "Credenciais não configuradas",
  ERRO: "Erro inesperado",
};

const ORIGEM_LABEL: Record<string, string> = {
  painel: "Salvas neste painel",
  secrets: "Configuração antiga do backend",
  ausente: "Não configuradas",
};

const FnrhCredenciaisPanel = () => {
  const { toast } = useToast();
  const [meta, setMeta] = useState<CredMetadados | null>(null);
  const [teste, setTeste] = useState<TesteResultado | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"testar" | "salvar" | null>(null);
  const [form, setForm] = useState({ api_user: "", api_password: "", cpf_solicitante: "" });

  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("fnrh-credenciais", { body });
    if (error) {
      let parsed: Record<string, unknown> | null = null;
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.text === "function") {
        try {
          parsed = JSON.parse(await ctx.text());
        } catch {
          parsed = null;
        }
      }
      throw Object.assign(new Error((parsed?.error as string) ?? error.message), { parsed });
    }
    return data as { credenciais: CredMetadados; teste?: TesteResultado };
  }, []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call({ acao: "status" });
      setMeta(data.credenciais);
    } catch (error) {
      toast({
        title: "Não foi possível carregar o status das credenciais",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const validar = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, value]) => [key, (value as string[])[0]]),
        ),
      );
      return null;
    }
    setErrors({});
    return parsed.data;
  };

  const executar = async (acao: "testar" | "salvar", usarSalvas = false) => {
    let payload: Record<string, unknown> = { acao };
    if (!usarSalvas) {
      const valores = validar();
      if (!valores) {
        toast({ title: "Revise os campos destacados", variant: "destructive" });
        return;
      }
      payload = { acao, ...valores };
    }

    setBusy(acao);
    setTeste(null);
    try {
      const data = await call(payload);
      setMeta(data.credenciais);
      if (data.teste) setTeste(data.teste);
      const ok = data.teste?.veredito === "OK";
      toast({
        title:
          acao === "salvar"
            ? ok
              ? "Credenciais salvas e aceitas pela FNRH"
              : "Credenciais salvas, mas a FNRH recusou o teste"
            : ok
              ? "Credenciais aceitas pela FNRH"
              : "A FNRH recusou estas credenciais",
        description: data.teste?.mensagem,
        variant: ok ? "default" : "destructive",
      });
      if (acao === "salvar") setForm((prev) => ({ ...prev, api_password: "" }));
    } catch (error) {
      const campos = (error as { parsed?: { campos?: Record<string, string[]> } }).parsed?.campos;
      if (campos) {
        setErrors(Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, v[0]])));
      }
      toast({
        title: acao === "salvar" ? "Falha ao salvar credenciais" : "Falha no teste de conexão",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-5 w-5 text-primary" />
          Credenciais da FNRH — Produção
        </CardTitle>
        <CardDescription>
          Autenticação Basic (usuário + senha de API) e CPF do solicitante (CADASTUR). Os valores são
          guardados apenas no backend e nunca são exibidos novamente nesta tela.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Ambiente: Produção</Badge>
            <code className="text-xs text-muted-foreground break-all">{BASE_URL_PRODUCAO}</code>
          </div>
          {loading ? (
            <p className="mt-2 text-muted-foreground">Carregando status…</p>
          ) : meta ? (
            <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
              <li>
                Situação:{" "}
                <span className={meta.configurado ? "text-foreground" : "text-destructive"}>
                  {meta.configurado ? "Configuradas" : "Não configuradas"}
                </span>
              </li>
              <li>Origem: {ORIGEM_LABEL[meta.origem] ?? meta.origem}</li>
              <li>Usuário: {meta.usuario_tamanho} caracteres</li>
              <li>Senha/chave: {meta.senha_tamanho} caracteres</li>
              <li>
                CPF do solicitante:{" "}
                {meta.cpf_solicitante_configurado
                  ? meta.cpf_solicitante_valido
                    ? "válido"
                    : "inválido"
                  : "não informado"}
              </li>
              <li>
                Espaços indevidos:{" "}
                {meta.usuario_com_espacos || meta.senha_com_espacos ? "sim" : "não"}
              </li>
              {meta.atualizado_em && (
                <li className="sm:col-span-2">
                  Última atualização: {new Date(meta.atualizado_em).toLocaleString("pt-BR")}
                  {meta.atualizado_por ? ` · por ${meta.atualizado_por}` : ""}
                </li>
              )}
            </ul>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fnrh-user">Usuário da API</Label>
            <Input
              id="fnrh-user"
              autoComplete="off"
              value={form.api_user}
              onChange={(e) => setForm((p) => ({ ...p, api_user: e.target.value }))}
              placeholder="usuário fornecido pelo Ministério do Turismo"
            />
            {errors.api_user && <p className="text-xs text-destructive">{errors.api_user}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fnrh-password">Senha / chave da API</Label>
            <div className="relative">
              <Input
                id="fnrh-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.api_password}
                onChange={(e) => setForm((p) => ({ ...p, api_password: e.target.value }))}
                placeholder="senha específica de API"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.api_password && <p className="text-xs text-destructive">{errors.api_password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fnrh-cpf">CPF do solicitante (CADASTUR)</Label>
            <Input
              id="fnrh-cpf"
              inputMode="numeric"
              value={form.cpf_solicitante}
              onChange={(e) => setForm((p) => ({ ...p, cpf_solicitante: e.target.value }))}
              placeholder="000.000.000-00"
            />
            {errors.cpf_solicitante && (
              <p className="text-xs text-destructive">{errors.cpf_solicitante}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => executar("testar")} disabled={busy !== null}>
            <Plug className={`mr-2 h-4 w-4 ${busy === "testar" ? "animate-pulse" : ""}`} />
            Testar sem salvar
          </Button>
          <Button onClick={() => executar("salvar")} disabled={busy !== null}>
            <Save className="mr-2 h-4 w-4" />
            {busy === "salvar" ? "Salvando…" : "Salvar credenciais"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => executar("testar", true)}
            disabled={busy !== null || !meta?.configurado}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Testar as credenciais em vigor
          </Button>
        </div>

        {teste && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              teste.veredito === "OK"
                ? "border-primary/40 bg-primary/5"
                : "border-destructive/40 bg-destructive/5"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {teste.veredito === "OK" ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="font-medium">
                {VEREDITO_LABEL[teste.veredito] ?? teste.veredito}
              </span>
              <span className="text-muted-foreground">
                HTTP {teste.http_status ?? "—"} · {teste.duration_ms} ms
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">{teste.mensagem}</p>
            {teste.api_mensagem && (
              <p className="mt-1 text-xs text-muted-foreground">
                Resposta oficial: {teste.api_mensagem}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FnrhCredenciaisPanel;
