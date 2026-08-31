import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CompletarDadosFnrhModal from "@/components/admin/fnrh/CompletarDadosFnrhModal";
import FnrhCredenciaisPanel from "@/components/admin/fnrh/FnrhCredenciaisPanel";
import FnrhConsultasPanel from "@/components/admin/fnrh/FnrhConsultasPanel";
import HospedesPanel from "@/components/admin/fnrh/HospedesPanel";

import {
  Search,
  RefreshCw,
  Send,
  LogIn,
  LogOut,
  Copy,
  AlertTriangle,
  ShieldCheck,
  PencilLine,
  Plug,
  UserCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
} from "lucide-react";



type Situacao =
  | "PRECHECKIN_PENDENTE"
  | "PRECHECKIN_REALIZADO"
  | "CHECKIN_REALIZADO"
  | "CHECKOUT_REALIZADO"
  | "NOSHOW"
  | "CANCELADO"
  | "ERRO_SINCRONIZACAO"
  | "DADOS_INCOMPLETOS"
  | "NAO_SINCRONIZADA";


interface Ficha {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  room_name: string | null;
  check_in: string;
  check_out: string;
  guests: number | null;
  status: string | null;
  situacao_fnrh: Situacao;
  link_precheckin: string | null;
  reserva_id_fnrh: string | null;
  hospede_id_fnrh: string | null;
  erro_sincronizacao_fnrh: string | null;
  fnrh_checkin_em: string | null;
  fnrh_checkout_em: string | null;
  created_at: string | null;
}

const SITUACAO_LABEL: Record<Situacao, string> = {
  NAO_SINCRONIZADA: "Não sincronizada",
  PRECHECKIN_PENDENTE: "Pré-check-in pendente",
  PRECHECKIN_REALIZADO: "Pré-check-in realizado",
  CHECKIN_REALIZADO: "Check-in realizado",
  CHECKOUT_REALIZADO: "Check-out realizado",
  NOSHOW: "No-show",
  CANCELADO: "Cancelado",
  ERRO_SINCRONIZACAO: "Erro de sincronização",
  DADOS_INCOMPLETOS: "Dados incompletos",
};


const SITUACAO_VARIANT: Record<Situacao, "default" | "secondary" | "outline" | "destructive"> = {
  NAO_SINCRONIZADA: "outline",
  PRECHECKIN_PENDENTE: "secondary",
  PRECHECKIN_REALIZADO: "secondary",
  CHECKIN_REALIZADO: "default",
  CHECKOUT_REALIZADO: "default",
  NOSHOW: "outline",
  CANCELADO: "outline",
  ERRO_SINCRONIZACAO: "destructive",
  DADOS_INCOMPLETOS: "destructive",
};


const formatDate = (value: string | null) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";

interface ErrorBody {
  error?: string;
  code?: string;
  details?: Array<{ field: string; message: string }> | unknown;
}

/** Lê o corpo JSON de uma resposta 4xx/5xx da Edge Function. */
const readErrorBody = async (error: unknown): Promise<ErrorBody | null> => {
  const ctx = (error as { context?: Response })?.context;
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    return (await ctx.clone().json()) as ErrorBody;
  } catch {
    return null;
  }
};

const formatSyncError = (message: string) => {
  if (message.includes("não respondeu")) return `Tempo limite da API oficial: ${message}`;
  if (message.includes("conectar à API")) return `Conectividade com a API oficial: ${message}`;
  if (message.includes("credenciais") || message.includes("401")) return `Autenticação recusada pela API oficial: ${message}`;
  return message;
};

interface DiagTeste {
  env: string;
  base_url: string;
  http_status: number | null;
  duration_ms: number;
  veredito: string;
  mensagem: string;
  api_mensagem: string | null;
  resposta_completa?: string | null;
  base64_confere?: boolean | null;
}


interface DiagResultado {
  env: string;
  testado_em?: string;
  credenciais: {
    usuario_configurado: boolean;
    senha_configurada: boolean;
    usuario_tamanho: number;
    senha_tamanho: number;
    usuario_com_espacos: boolean;
    senha_com_espacos: boolean;
    contem_quebra_de_linha: boolean;
    cpf_solicitante_configurado: boolean;
    cpf_solicitante_valido: boolean;
  };
  testes: DiagTeste[];
}

const Fnrh = () => {
  const { toast } = useToast();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [env, setEnv] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [completar, setCompletar] = useState<{ ficha: Ficha; fields: string[] } | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [diag, setDiag] = useState<DiagResultado | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [showConsultas, setShowConsultas] = useState(false);
  const [showHospedes, setShowHospedes] = useState(false);




  const loadFichas = useCallback(async () => {
    setLoading(true);

    // Garante uma sessão válida antes de chamar a função protegida
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (!refreshed.session) {
        setLoading(false);
        setSessionExpired(true);
        toast({
          title: "Sessão expirada",
          description: "Entre novamente no painel para carregar as fichas do FNRH.",
          variant: "destructive",
        });
        return;
      }
    }
    setSessionExpired(false);

    const body: Record<string, unknown> = { limit: 150 };
    if (busca.trim()) body.busca = busca.trim();
    if (situacao !== "todas") body.situacao = situacao;
    if (dataInicio) body.data_inicio = dataInicio;
    if (dataFim) body.data_fim = dataFim;

    const { data, error } = await supabase.functions.invoke("fnrh-listar-fichas", { body });
    setLoading(false);

    if (error) {
      const parsed = await readErrorBody(error);
      const expired = parsed?.code === "SEM_SESSAO" || parsed?.code === "SESSAO_EXPIRADA";
      if (expired) setSessionExpired(true);
      toast({
        title: expired ? "Sessão expirada" : "Erro ao carregar fichas",
        description: parsed?.error ?? error.message,
        variant: "destructive",
      });
      return;
    }
    setEnv(data?.env ?? "");
    setFichas((data?.fichas ?? []) as Ficha[]);
  }, [busca, situacao, dataInicio, dataFim, toast]);


  useEffect(() => {
    loadFichas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validação client-side: bloqueia envio de reserva sem número/datas válidas.
  const validarAntesDeEnviar = (ficha: Ficha | undefined): string | null => {
    if (!ficha) return null;
    const numero = (ficha.id || "").replace(/-/g, "").slice(0, 6);
    if (!numero) return "Reserva sem número válido — verifique o cadastro.";
    const plausivel = (d?: string | null) => {
      if (!d) return false;
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return false;
      const ano = date.getUTCFullYear();
      return ano >= 2000 && ano <= 2100;
    };
    if (!plausivel(ficha.check_in) || !plausivel(ficha.check_out)) {
      return "Reserva sem número/datas válidas — verifique o cadastro.";
    }
    if (new Date(ficha.check_out) <= new Date(ficha.check_in)) {
      return "A data de saída deve ser posterior à de entrada — verifique o cadastro.";
    }
    if ((ficha.guests ?? 0) < 1) return "Reserva sem quantidade de hóspedes — verifique o cadastro.";
    return null;
  };

  const runAction = async (
    fn: "fnrh-criar-reserva" | "fnrh-checkin" | "fnrh-checkout" | "fnrh-reprocessar-reserva",
    reservationId: string,
    successMessage: string,
    extraBody?: Record<string, unknown>,
  ): Promise<boolean> => {
    if (fn === "fnrh-criar-reserva" || fn === "fnrh-reprocessar-reserva") {
      const problema = validarAntesDeEnviar(fichas.find((f) => f.id === reservationId));
      if (problema) {
        toast({ title: "Envio bloqueado", description: problema, variant: "destructive" });
        return false;
      }
    }
    setBusy(`${fn}:${reservationId}`);
    const { data, error } = await supabase.functions.invoke(fn, {
      body: { reservation_id: reservationId, ...(extraBody ?? {}) },
    });

    setBusy(null);

    if (error) {
      const parsed = await readErrorBody(error);
      const issues = Array.isArray(parsed?.details)
        ? (parsed!.details as Array<{ field: string; message: string }>)
        : [];

      if (parsed?.code === "VALIDACAO_FNRH" && issues.length > 0) {
        const ficha = fichas.find((f) => f.id === reservationId);
        if (ficha) {
          setCompletar({ ficha, fields: issues.map((i) => i.field) });
        }
        toast({
          title: "Dados obrigatórios faltando",
          description: issues.map((i) => i.message).join(" "),
          variant: "destructive",
        });
        await loadFichas();
        return false;
      }

      toast({
        title: "Falha na operação",
        description:
          parsed?.error ??
          (issues.length > 0 ? issues.map((i) => i.message).join(" ") : error.message),
        variant: "destructive",
      });
      await loadFichas();
      return false;
    }
    if (data?.error) {
      toast({ title: "FNRH retornou erro", description: String(data.error), variant: "destructive" });
      await loadFichas();
      return false;
    }
    toast({ title: successMessage });
    await loadFichas();
    return true;
  };


  const reprocessarLote = async () => {
    setBusy("lote");
    const { data, error } = await supabase.functions.invoke("fnrh-reprocessar-reserva", {
      body: { limit: 10 },
    });
    setBusy(null);
    if (error) {
      toast({ title: "Falha ao reprocessar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Reprocessadas: ${data?.processadas ?? 0}` });
    await loadFichas();
  };

  const testarConexao = async (compararAmbientes = false) => {
    setDiagLoading(true);
    setDiag(null);
    const { data, error } = await supabase.functions.invoke("fnrh-diagnostico", {
      body: { comparar_ambientes: compararAmbientes },
    });
    setDiagLoading(false);

    if (error) {
      const parsed = await readErrorBody(error);
      const expired = parsed?.code === "SEM_SESSAO" || parsed?.code === "SESSAO_EXPIRADA";
      if (expired) setSessionExpired(true);
      toast({
        title: expired ? "Sessão expirada" : "Falha no diagnóstico",
        description: parsed?.error ?? error.message,
        variant: "destructive",
      });
      return;
    }

    const result = data as DiagResultado;
    setDiag(result);
    const principal = result.testes?.[0];
    toast({
      title: principal?.veredito === "OK" ? "Credenciais aceitas pela FNRH" : "FNRH recusou a conexão",
      description: principal?.mensagem,
      variant: principal?.veredito === "OK" ? "default" : "destructive",
    });
  };


  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast({ title: "Link de pré-check-in copiado" });
  };

  const stats = useMemo(() => {
    const total = fichas.length;
    const erros = fichas.filter((f) => f.situacao_fnrh === "ERRO_SINCRONIZACAO").length;
    const pendentes = fichas.filter((f) => f.situacao_fnrh === "NAO_SINCRONIZADA").length;
    const sincronizadas = fichas.filter((f) => Boolean(f.reserva_id_fnrh)).length;
    return { total, erros, pendentes, sincronizadas };
  }, [fichas]);

  return (
    <div className="space-y-6">
      {sessionExpired && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">
            Sua sessão administrativa expirou, por isso as fichas não puderam ser carregadas. Entre novamente para continuar.
          </p>
          <Button variant="outline" onClick={() => (window.location.href = "/auth")}>
            <LogIn className="mr-2 h-4 w-4" />
            Entrar novamente
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">FNRH</h1>
          <p className="text-sm text-muted-foreground">
            Fichas Nacionais de Registro de Hóspedes — Ministério do Turismo
            {env ? ` · ambiente ${env}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowCreds((v) => !v)}>
            <KeyRound className="h-4 w-4 mr-2" />
            {showCreds ? "Fechar credenciais" : "Credenciais"}
          </Button>
          <Button variant="outline" onClick={() => setShowConsultas((v) => !v)}>
            <Search className="h-4 w-4 mr-2" />
            {showConsultas ? "Fechar consultas" : "Consultas API"}
           </Button>
          <Button variant="outline" onClick={() => setShowHospedes((v) => !v)}>
            <UserCheck className="h-4 w-4 mr-2" />
            {showHospedes ? "Fechar hóspedes" : "Recebimento e envio"}
          </Button>
          <Button variant="outline" onClick={() => testarConexao(false)} disabled={diagLoading}>
            <Plug className={`h-4 w-4 mr-2 ${diagLoading ? "animate-pulse" : ""}`} />
            Testar conexão FNRH
          </Button>
          <Button variant="outline" onClick={loadFichas} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={reprocessarLote} disabled={busy === "lote"}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reprocessar erros
          </Button>
        </div>
      </div>

      {showCreds && <FnrhCredenciaisPanel />}

      {showConsultas && <FnrhConsultasPanel />}



      {diag && (
        <Card
          className={
            diag.testes[0]?.veredito === "OK"
              ? "border-primary/40 bg-primary/5"
              : "border-destructive/40 bg-destructive/5"
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {diag.testes[0]?.veredito === "OK" ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Diagnóstico de autenticação FNRH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {diag.testes.map((teste) => (
              <div key={teste.env} className="rounded-lg border border-border bg-card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={teste.veredito === "OK" ? "default" : "destructive"}>
                    {teste.veredito}
                  </Badge>
                  <span className="font-medium">Ambiente: {teste.env}</span>
                  <span className="text-muted-foreground">
                    HTTP {teste.http_status ?? "—"} · {teste.duration_ms} ms
                  </span>
                </div>
                <p className="mt-2">{teste.mensagem}</p>
                {teste.api_mensagem && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Resposta oficial: {teste.api_mensagem}
                  </p>
                )}
                {teste.base64_confere != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Codificação Basic (Base64) conferida:{" "}
                    {teste.base64_confere ? "igual à esperada (código correto)" : "diferente da esperada (revisar credenciais)"}
                  </p>
                )}
                {teste.resposta_completa && (
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-[11px] text-muted-foreground">
                    {teste.resposta_completa}
                  </pre>
                )}
              </div>
            ))}


            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <span>Usuário configurado: {diag.credenciais.usuario_configurado ? "sim" : "não"} ({diag.credenciais.usuario_tamanho} caracteres)</span>
              <span>Senha configurada: {diag.credenciais.senha_configurada ? "sim" : "não"} ({diag.credenciais.senha_tamanho} caracteres)</span>
              <span>Espaços extras na credencial: {diag.credenciais.usuario_com_espacos || diag.credenciais.senha_com_espacos ? "sim (revisar)" : "não"}</span>
              <span>Quebra de linha na credencial: {diag.credenciais.contem_quebra_de_linha ? "sim (revisar)" : "não"}</span>
              <span>CPF do solicitante: {diag.credenciais.cpf_solicitante_valido ? "válido (11 dígitos)" : diag.credenciais.cpf_solicitante_configurado ? "configurado, mas fora do formato" : "ausente"}</span>
              {diag.testado_em && <span>Testado em: {new Date(diag.testado_em).toLocaleString("pt-BR")}</span>}
            </div>

            {diag.testes[0]?.veredito !== "OK" && (
              <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                <p className="font-medium text-foreground">O que verificar com o suporte da FNRH:</p>
                <p>1. O usuário está habilitado no ambiente de produção (não apenas em homologação).</p>
                <p>2. A senha usada é a de API/integração, que costuma ser diferente da senha do portal web.</p>
                <p>3. O CPF do solicitante está vinculado ao CADASTUR do meio de hospedagem.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => testarConexao(true)}
                  disabled={diagLoading}
                >
                  Comparar produção e homologação
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Fichas listadas", value: stats.total, icon: ShieldCheck },
          { label: "Sincronizadas", value: stats.sincronizadas, icon: Send },
          { label: "Não sincronizadas", value: stats.pendentes, icon: RefreshCw },
          { label: "Com erro", value: stats.erros, icon: AlertTriangle },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-semibold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome, email ou ID da reserva"
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadFichas()}
            />
          </div>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger>
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as situações</SelectItem>
              {(Object.keys(SITUACAO_LABEL) as Situacao[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SITUACAO_LABEL[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <div className="md:col-span-5">
            <Button onClick={loadFichas} disabled={loading}>
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fichas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hóspede</TableHead>
                <TableHead>Bangalô</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Situação FNRH</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fichas.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma ficha encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {fichas.map((ficha) => {
                const isBusy = busy?.endsWith(`:${ficha.id}`);
                return (
                  <TableRow key={ficha.id}>
                    <TableCell>
                      <div className="font-medium">{ficha.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{ficha.guest_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{ficha.room_name ?? "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(ficha.check_in)} → {formatDate(ficha.check_out)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={SITUACAO_VARIANT[ficha.situacao_fnrh]}>
                        {SITUACAO_LABEL[ficha.situacao_fnrh]}
                      </Badge>
                      {ficha.erro_sincronizacao_fnrh && (
                        <p className="text-xs text-destructive mt-1 max-w-[280px]">
                          {formatSyncError(ficha.erro_sincronizacao_fnrh)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {!ficha.reserva_id_fnrh && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() =>
                              runAction("fnrh-criar-reserva", ficha.id, "Ficha enviada à FNRH")
                            }
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Enviar
                          </Button>
                        )}
                        {ficha.link_precheckin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyLink(ficha.link_precheckin!)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        )}
                        {ficha.reserva_id_fnrh && !ficha.fnrh_checkin_em && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() =>
                              runAction("fnrh-checkin", ficha.id, "Check-in registrado na FNRH")
                            }
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            Check-in
                          </Button>
                        )}
                        {ficha.fnrh_checkin_em && !ficha.fnrh_checkout_em && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() =>
                              runAction("fnrh-checkout", ficha.id, "Check-out registrado na FNRH")
                            }
                          >
                            <LogOut className="h-4 w-4 mr-1" />
                            Check-out
                          </Button>
                        )}
                        {ficha.situacao_fnrh === "DADOS_INCOMPLETOS" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isBusy}
                            onClick={() => setCompletar({ ficha, fields: [] })}
                          >
                            <PencilLine className="h-4 w-4 mr-1" />
                            Completar dados
                          </Button>
                        )}
                        {ficha.situacao_fnrh === "ERRO_SINCRONIZACAO" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isBusy}
                            onClick={() =>
                              runAction("fnrh-reprocessar-reserva", ficha.id, "Reprocessada")
                            }
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Tentar novamente
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {completar && (
        <CompletarDadosFnrhModal
          open
          onOpenChange={(open) => !open && setCompletar(null)}
          guestName={completar.ficha.guest_name}
          guests={completar.ficha.guests}
          pendingFields={completar.fields}
          submitting={busy === `fnrh-criar-reserva:${completar.ficha.id}`}
          onSubmit={async (hospede) => {
            const ficha = completar.ficha;
            const success = await runAction(
              "fnrh-criar-reserva",
              ficha.id,
              "Ficha enviada à FNRH",
              { hospede },
            );
            if (success) setCompletar(null);
          }}
        />
      )}
    </div>

  );
};

export default Fnrh;
