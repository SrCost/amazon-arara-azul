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
import {
  Search,
  RefreshCw,
  Send,
  LogIn,
  LogOut,
  Copy,
  AlertTriangle,
  ShieldCheck,
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
};

const formatDate = (value: string | null) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";

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

  const loadFichas = useCallback(async () => {
    setLoading(true);
    const body: Record<string, unknown> = { limit: 150 };
    if (busca.trim()) body.busca = busca.trim();
    if (situacao !== "todas") body.situacao = situacao;
    if (dataInicio) body.data_inicio = dataInicio;
    if (dataFim) body.data_fim = dataFim;

    const { data, error } = await supabase.functions.invoke("fnrh-listar-fichas", { body });
    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao carregar fichas",
        description: error.message,
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

  const runAction = async (
    fn: "fnrh-criar-reserva" | "fnrh-checkin" | "fnrh-checkout" | "fnrh-reprocessar-reserva",
    reservationId: string,
    successMessage: string,
  ) => {
    setBusy(`${fn}:${reservationId}`);
    const { data, error } = await supabase.functions.invoke(fn, {
      body: { reservation_id: reservationId },
    });
    setBusy(null);

    if (error) {
      toast({ title: "Falha na operação", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.error) {
      toast({ title: "FNRH retornou erro", description: String(data.error), variant: "destructive" });
      await loadFichas();
      return;
    }
    toast({ title: successMessage });
    await loadFichas();
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">FNRH</h1>
          <p className="text-sm text-muted-foreground">
            Fichas Nacionais de Registro de Hóspedes — Ministério do Turismo
            {env ? ` · ambiente ${env}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
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
                          {ficha.erro_sincronizacao_fnrh}
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
    </div>
  );
};

export default Fnrh;
