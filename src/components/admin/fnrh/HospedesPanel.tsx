import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MailCheck,
  MailX,
  Inbox,
} from "lucide-react";

interface ReservationRow {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  room_name: string | null;
  check_in: string;
  check_out: string;
  status: string | null;
  guests: number | null;
  cpf: string | null;
  passport: string | null;
  documento_tipo: string | null;
  birth_date: string | null;
  nationality: string | null;
  country: string | null;
  is_foreign: boolean | null;
  checkin_completed: boolean | null;
  pre_checkin_email_sent: boolean | null;
  pre_checkin_email_sent_at: string | null;
  situacao_fnrh: string | null;
}

interface CheckinRow {
  reservation_id: string;
  created_at: string | null;
  full_name: string | null;
  document: string | null;
  birth_date: string | null;
  nationality: string | null;
  city_state: string | null;
  address: string | null;
  transport_mode: string | null;
  travel_reason: string | null;
  estimated_arrival_time: string | null;
}

interface PreArrivalRow {
  reservation_id: string;
  status: string | null;
  answered_at: string | null;
  last_sent_at: string | null;
}

type Filtro = "todos" | "pendentes" | "completos";

const formatDate = (value: string | null | undefined) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

const codigo = (id: string) => `PAA-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

const texto = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

const HospedesPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [preArrivals, setPreArrivals] = useState<PreArrivalRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, ci, pa] = await Promise.all([
      supabase
        .from("reservations")
        .select(
          "id, guest_name, guest_email, guest_phone, room_name, check_in, check_out, status, guests, cpf, passport, documento_tipo, birth_date, nationality, country, is_foreign, checkin_completed, pre_checkin_email_sent, pre_checkin_email_sent_at, situacao_fnrh",
        )
        .order("check_in", { ascending: false })
        .limit(300),
      supabase
        .from("booking_checkins")
        .select(
          "reservation_id, created_at, full_name, document, birth_date, nationality, city_state, address, transport_mode, travel_reason, estimated_arrival_time",
        ),
      supabase
        .from("pre_arrival_responses")
        .select("reservation_id, status, answered_at, last_sent_at"),
    ]);
    setLoading(false);

    const firstError = res.error || ci.error || pa.error;
    if (firstError) {
      toast({
        title: "Erro ao carregar hóspedes",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setReservations((res.data ?? []) as ReservationRow[]);
    setCheckins((ci.data ?? []) as CheckinRow[]);
    setPreArrivals((pa.data ?? []) as PreArrivalRow[]);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const checkinById = useMemo(
    () => new Map(checkins.map((c) => [c.reservation_id, c])),
    [checkins],
  );

  const preArrivalById = useMemo(
    () => new Map(preArrivals.map((p) => [p.reservation_id, p])),
    [preArrivals],
  );

  const linhas = useMemo(() => {
    return reservations.map((r) => {
      const ci = checkinById.get(r.id);
      const pa = preArrivalById.get(r.id);
      const nome = texto(ci?.full_name) ?? r.guest_name;
      const nascimento = texto(ci?.birth_date) ?? texto(r.birth_date);
      const nacionalidade =
        texto(ci?.nationality) ?? texto(r.nationality) ?? texto(r.country);
      const documento = texto(ci?.document) ?? texto(r.cpf) ?? texto(r.passport);
      const tipoDocumento =
        texto(r.documento_tipo) ??
        (texto(r.cpf) ? "CPF" : texto(r.passport) ? "Passaporte" : null);
      const completo = Boolean(ci) || Boolean(r.checkin_completed) || Boolean(pa?.answered_at);
      const faltando = [
        !nascimento && "nascimento",
        !nacionalidade && "nacionalidade",
        !documento && "documento",
      ].filter(Boolean) as string[];

      return {
        reserva: r,
        checkin: ci,
        preArrival: pa,
        nome,
        nascimento,
        nacionalidade,
        documento,
        tipoDocumento,
        completo,
        faltando,
      };
    });
  }, [reservations, checkinById, preArrivalById]);

  const filtradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return linhas.filter((l) => {
      if (filtro === "pendentes" && l.completo) return false;
      if (filtro === "completos" && !l.completo) return false;
      if (!term) return true;
      return (
        l.nome.toLowerCase().includes(term) ||
        (l.reserva.guest_email ?? "").toLowerCase().includes(term) ||
        (l.documento ?? "").toLowerCase().includes(term) ||
        codigo(l.reserva.id).toLowerCase().includes(term)
      );
    });
  }, [linhas, busca, filtro]);

  const stats = useMemo(
    () => ({
      total: linhas.length,
      completos: linhas.filter((l) => l.completo).length,
      pendentes: linhas.filter((l) => !l.completo).length,
      semEmail: linhas.filter((l) => !l.completo && !l.reserva.pre_checkin_email_sent).length,
    }),
    [linhas],
  );

  return (
    <Card className="border-primary/20">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Recebimento e envio por hóspede</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dados coletados no pré check-in (nascimento, nacionalidade e documento), envio do e-mail
            e recebimento das respostas.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Reservas listadas</p>
            <p className="text-xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Pré check-in recebido</p>
            <p className="text-xl font-semibold text-primary">{stats.completos}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-xl font-semibold">{stats.pendentes}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Pendentes sem e-mail enviado</p>
            <p className="text-xl font-semibold">{stats.semEmail}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por hóspede, e-mail, documento ou código"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(
              [
                ["todos", "Todos"],
                ["pendentes", "Pendentes"],
                ["completos", "Concluídos"],
              ] as [Filtro, string][]
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={filtro === value ? "default" : "outline"}
                onClick={() => setFiltro(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Hóspede</TableHead>
                <TableHead>Estadia</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Nacionalidade</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Envio</TableHead>
                <TableHead>Recebimento</TableHead>
                <TableHead>Dados faltantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Carregando…
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhum hóspede encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filtradas.map((l) => (
                <TableRow key={l.reserva.id}>
                  <TableCell className="font-mono text-xs">{codigo(l.reserva.id)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{l.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.reserva.guest_email ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {l.reserva.room_name ?? "—"}
                      {l.reserva.guests ? ` · ${l.reserva.guests} hóspede(s)` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(l.reserva.check_in)} → {formatDate(l.reserva.check_out)}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(l.nascimento)}</TableCell>
                  <TableCell className="text-sm">{l.nacionalidade ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {l.documento ? (
                      <>
                        <div>{l.documento}</div>
                        {l.tipoDocumento && (
                          <div className="text-xs text-muted-foreground">{l.tipoDocumento}</div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {l.reserva.pre_checkin_email_sent ? (
                      <div className="space-y-1">
                        <Badge variant="secondary" className="gap-1">
                          <MailCheck className="h-3 w-3" /> E-mail enviado
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(l.reserva.pre_checkin_email_sent_at)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <MailX className="h-3 w-3" /> Não enviado
                      </Badge>
                    )}
                    {l.preArrival?.last_sent_at && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Pré-chegada enviada {formatDateTime(l.preArrival.last_sent_at)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {l.completo ? (
                      <div className="space-y-1">
                        <Badge className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Recebido
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Formulário: {formatDateTime(l.checkin?.created_at)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pré-chegada: {formatDateTime(l.preArrival?.answered_at)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> Aguardando
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Inbox className="h-3 w-3" /> Nenhuma resposta recebida
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {l.faltando.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> {l.faltando.join(", ")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HospedesPanel;
