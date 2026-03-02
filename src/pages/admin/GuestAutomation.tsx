import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Mail, CheckCircle, Clock, Star, Users, LogIn, LogOut, MessageSquare, XCircle
} from "lucide-react";

interface ReservationRow {
  id: string;
  guest_name: string;
  guest_email: string;
  room_name: string | null;
  check_in: string;
  check_out: string;
  status: string | null;
  checkin_completed: boolean | null;
  checkout_completed: boolean | null;
}

interface CheckoutFeedback {
  rating: number;
  comment: string | null;
  issues: string | null;
  created_at: string | null;
}

const GuestAutomation = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ReservationRow[]>([]);
  const [upcoming, setUpcoming] = useState<ReservationRow[]>([]);
  const [recent, setRecent] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<CheckoutFeedback | null>(null);
  const [stats, setStats] = useState({
    checkinPending: 0,
    checkinDone: 0,
    checkoutPending: 0,
    checkoutDone: 0,
    avgRating: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const today = new Date();
    const threeDaysAhead = new Date(today);
    threeDaysAhead.setDate(today.getDate() + 3);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Fetch upcoming check-ins (next 3 days) and recent checkouts (last 3 days)
    const [upRes, recentRes, checkoutStats] = await Promise.all([
      supabase
        .from("reservations")
        .select("id, guest_name, guest_email, room_name, check_in, check_out, status, checkin_completed, checkout_completed")
        .gte("check_in", fmt(today))
        .lte("check_in", fmt(threeDaysAhead))
        .in("status", ["pending", "confirmed"])
        .order("check_in", { ascending: true })
        .limit(50),
      supabase
        .from("reservations")
        .select("id, guest_name, guest_email, room_name, check_in, check_out, status, checkin_completed, checkout_completed")
        .gte("check_out", fmt(threeDaysAgo))
        .lte("check_out", fmt(today))
        .in("status", ["pending", "confirmed"])
        .order("check_out", { ascending: false })
        .limit(50),
      supabase
        .from("booking_checkouts")
        .select("rating"),
    ]);

    const upData = (upRes.data || []) as ReservationRow[];
    const recentData = (recentRes.data || []) as ReservationRow[];

    setUpcoming(upData);
    setRecent(recentData);

    // Calculate stats
    const allReservations = [...upData, ...recentData];
    const uniqueMap = new Map<string, ReservationRow>();
    allReservations.forEach((r) => uniqueMap.set(r.id, r));
    const unique = Array.from(uniqueMap.values());

    const ratings = (checkoutStats.data || []).map((c: any) => c.rating).filter(Boolean);
    const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

    setStats({
      checkinPending: unique.filter((r) => !r.checkin_completed).length,
      checkinDone: unique.filter((r) => r.checkin_completed).length,
      checkoutPending: unique.filter((r) => !r.checkout_completed).length,
      checkoutDone: unique.filter((r) => r.checkout_completed).length,
      avgRating: Math.round(avgRating * 10) / 10,
    });

    setLoading(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email, room_name, check_in, check_out, status, checkin_completed, checkout_completed")
      .or(
        `guest_name.ilike.%${search}%,guest_email.ilike.%${search}%,id.eq.${
          search.length === 36 ? search : "00000000-0000-0000-0000-000000000000"
        }`
      )
      .order("check_in", { ascending: false })
      .limit(20);

    if (error) {
      toast({ title: "Erro na busca", variant: "destructive" });
    } else {
      setSearchResults(data || []);
    }
    setLoading(false);
  }

  async function sendEmail(reservationId: string, type: "checkin" | "checkout") {
    setSendingEmail(`${type}-${reservationId}`);
    try {
      const fn = type === "checkin" ? "send-checkin-email" : "send-checkout-email";
      const { error } = await supabase.functions.invoke(fn, {
        body: { reservationId },
      });
      if (error) throw error;
      toast({ title: `Email de ${type === "checkin" ? "check-in" : "check-out"} enviado!` });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    }
    setSendingEmail(null);
  }

  async function viewFeedback(reservationId: string) {
    const { data } = await supabase
      .from("booking_checkouts")
      .select("rating, comment, issues, created_at")
      .eq("reservation_id", reservationId)
      .maybeSingle();

    if (data) {
      setFeedbackModal(data as CheckoutFeedback);
    } else {
      toast({ title: "Nenhum feedback encontrado" });
    }
  }

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR");

  const StatusBadge = ({ done }: { done: boolean | null }) =>
    done ? (
      <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
        <CheckCircle className="h-3 w-3 mr-1" /> Concluído
      </Badge>
    ) : (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" /> Pendente
      </Badge>
    );

  const ReservationTable = ({ rows, showType }: { rows: ReservationRow[]; showType: "checkin" | "checkout" | "both" }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hóspede</TableHead>
            <TableHead className="hidden sm:table-cell">Bangalô</TableHead>
            <TableHead>Datas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhuma reserva encontrada
              </TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="font-medium text-foreground">{r.guest_name}</div>
                <div className="text-xs text-muted-foreground">{r.guest_email}</div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">{r.room_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(r.check_in)} — {formatDate(r.check_out)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {(showType === "checkin" || showType === "both") && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">In:</span>
                      <StatusBadge done={r.checkin_completed} />
                    </div>
                  )}
                  {(showType === "checkout" || showType === "both") && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Out:</span>
                      <StatusBadge done={r.checkout_completed} />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {!r.checkin_completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendEmail(r.id, "checkin")}
                      disabled={sendingEmail === `checkin-${r.id}`}
                      className="text-xs"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {sendingEmail === `checkin-${r.id}` ? "..." : "Check-in"}
                    </Button>
                  )}
                  {!r.checkout_completed && r.checkin_completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendEmail(r.id, "checkout")}
                      disabled={sendingEmail === `checkout-${r.id}`}
                      className="text-xs"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {sendingEmail === `checkout-${r.id}` ? "..." : "Check-out"}
                    </Button>
                  )}
                  {r.checkout_completed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewFeedback(r.id)}
                      className="text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Feedback
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Automação de Hóspedes
        </h1>
        <p className="text-muted-foreground mt-1">
          Check-in e check-out digital — visão geral e envio manual
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <LogIn className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.checkinPending}</p>
              <p className="text-xs text-muted-foreground">Check-in pendente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.checkinDone}</p>
              <p className="text-xs text-muted-foreground">Check-in feito</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <LogOut className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.checkoutPending}</p>
              <p className="text-xs text-muted-foreground">Check-out pendente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.checkoutDone}</p>
              <p className="text-xs text-muted-foreground">Check-out feito</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--golden))]/10">
              <Star className="h-5 w-5 text-[hsl(var(--golden))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.avgRating || "—"}</p>
              <p className="text-xs text-muted-foreground">Nota média</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Upcoming / Recent / Search */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            <LogIn className="h-4 w-4 mr-1" />
            Próximos Check-ins
          </TabsTrigger>
          <TabsTrigger value="recent">
            <LogOut className="h-4 w-4 mr-1" />
            Check-outs Recentes
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-1" />
            Buscar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Check-ins nos próximos 3 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ReservationTable rows={upcoming} showType="checkin" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Check-outs dos últimos 3 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ReservationTable rows={recent} showType="checkout" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buscar Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome, email ou ID da reserva"
                  maxLength={200}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </form>
              <ReservationTable rows={searchResults} showType="both" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Modal */}
      <Dialog open={!!feedbackModal} onOpenChange={() => setFeedbackModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback do Hóspede</DialogTitle>
          </DialogHeader>
          {feedbackModal && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Nota:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star
                      key={v}
                      className={`h-5 w-5 ${
                        v <= feedbackModal.rating
                          ? "text-[hsl(var(--golden))] fill-[hsl(var(--golden))]"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{feedbackModal.rating}/5</span>
              </div>
              {feedbackModal.comment && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Comentário:</p>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {feedbackModal.comment}
                  </p>
                </div>
              )}
              {feedbackModal.issues && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Problemas reportados:</p>
                  <p className="text-sm text-muted-foreground bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                    {feedbackModal.issues}
                  </p>
                </div>
              )}
              {!feedbackModal.comment && !feedbackModal.issues && (
                <p className="text-sm text-muted-foreground italic">Nenhum comentário adicional.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestAutomation;
