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
import { Search, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

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

type Filtro = "todos" | "pendentes" | "completos";

const formatDate = (value: string | null | undefined) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

const codigo = (id: string) => `PAA-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

const texto = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

const Hospedes = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, ci] = await Promise.all([
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
    ]);
    setLoading(false);

    const firstError = res.error || ci.error;
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
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const checkinById = useMemo(
    () => new Map(checkins.map((c) => [c.reservation_id, c])),
    [checkins],
  );

  const linhas = useMemo(() => {
    return reservations.map((r) => {
      const ci = checkinById.get(r.id);
      const nome = texto(ci?.full_name) ?? r.guest_name;
      const nascimento = texto(ci?.birth_date) ?? texto(r.birth_date);
      const nacionalidade =
        texto(ci?.nationality) ?? texto(r.nationality) ?? texto(r.country);
      const documento = texto(ci?.document) ?? texto(r.cpf) ?? texto(r.passport);
      const tipoDocumento =
        texto(r.documento_tipo) ??
        (texto(r.cpf) ? "CPF" : texto(r.passport) ? "Passaporte" : null);
      const completo = Boolean(ci) || Boolean(r.checkin_completed);
      const faltando = [
        !nascimento && "nascimento",
        !nacionalidade && "nacionalidade",
        !documento && "documento",
      ].filter(Boolean) as string[];

      return {
        reserva: r,
        checkin: ci,
        nome,
        nascimento,
        nacionalidade,
        documento,
        tipoDocumento,
        completo,
        faltando,
      };
    });
  }, [reservations, checkinById]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Hóspedes por reserva</h1>
          <p className="text-sm text-muted-foreground">
            Dados coletados no pré check-in (nascimento, nacionalidade e documento) e status de quem
            ainda não concluiu o processo.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reservas listadas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pré check-in concluído</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-primary">{stats.completos}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.pendentes}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendentes sem e-mail enviado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.semEmail}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Hóspede</TableHead>
                <TableHead>Estadia</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Nacionalidade</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Pré check-in</TableHead>
                <TableHead>Dados faltantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Carregando…
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                    {l.completo ? (
                      <div className="space-y-1">
                        <Badge className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Concluído
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(l.checkin?.created_at)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> Pendente
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {l.reserva.pre_checkin_email_sent
                            ? `E-mail enviado ${formatDateTime(l.reserva.pre_checkin_email_sent_at)}`
                            : "E-mail não enviado"}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Hospedes;
