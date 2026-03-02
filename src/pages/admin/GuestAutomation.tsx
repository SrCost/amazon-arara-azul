import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, CheckCircle, XCircle, Clock } from "lucide-react";

interface ReservationResult {
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

const GuestAutomation = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ReservationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingCheckin, setSendingCheckin] = useState<string | null>(null);
  const [sendingCheckout, setSendingCheckout] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email, room_name, check_in, check_out, status, checkin_completed, checkout_completed")
      .or(`guest_name.ilike.%${search}%,guest_email.ilike.%${search}%,id.eq.${search.length === 36 ? search : "00000000-0000-0000-0000-000000000000"}`)
      .order("check_in", { ascending: false })
      .limit(20);

    if (error) {
      toast({ title: "Erro na busca", variant: "destructive" });
    } else {
      setResults(data || []);
    }
    setLoading(false);
  }

  async function sendEmail(reservationId: string, type: "checkin" | "checkout") {
    const setter = type === "checkin" ? setSendingCheckin : setSendingCheckout;
    setter(reservationId);

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
    setter(null);
  }

  const formatDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR");

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Automação de Hóspedes</h1>
        <p className="text-muted-foreground mt-1">Gerencie check-in e check-out digital dos hóspedes</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou ID da reserva"
            maxLength={200}
          />
        </div>
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.id} className="bg-card rounded-lg border border-border p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{r.guest_name}</h3>
                  <p className="text-sm text-muted-foreground">{r.guest_email}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.room_name} • {formatDate(r.check_in)} — {formatDate(r.check_out)}
                  </p>
                </div>
                <Badge variant={r.status === "confirmed" ? "default" : "secondary"}>{r.status}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Check-in:</span>
                  <StatusBadge done={r.checkin_completed} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Check-out:</span>
                  <StatusBadge done={r.checkout_completed} />
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendEmail(r.id, "checkin")}
                  disabled={sendingCheckin === r.id || !!r.checkin_completed}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {sendingCheckin === r.id ? "Enviando..." : "Email Check-in"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendEmail(r.id, "checkout")}
                  disabled={sendingCheckout === r.id || !!r.checkout_completed}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {sendingCheckout === r.id ? "Enviando..." : "Email Check-out"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && search && (
        <p className="text-muted-foreground text-center py-8">Nenhuma reserva encontrada</p>
      )}
    </div>
  );
};

export default GuestAutomation;
