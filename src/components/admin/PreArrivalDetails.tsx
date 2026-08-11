import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HeartPulse, Loader2 } from "lucide-react";

export interface AdminPreArrivalAnswers {
  status: string;
  language: string | null;
  first_sent_at: string | null;
  last_sent_at: string | null;
  answered_at: string | null;
  updated_at: string | null;
  reminders_sent: number;
  last_send_origin: string | null;
  dietary_restrictions: string[] | null;
  foods_to_avoid: string | null;
  children_info: string | null;
  special_occasion: string | null;
  special_occasion_detail: string | null;
  additional_info: string | null;
  can_view_health: boolean;
  health_condition: string | null;
  mobility_limitations: string | null;
  continuous_medication: string | null;
}

export interface ReservationSummaryInfo {
  guest_name?: string;
  rooms_summary?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
}

interface Props {
  reservationId: string;
  reservation?: ReservationSummaryInfo;
}

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const fmtDate = (v?: string | null) =>
  v ? new Date(v + "T12:00:00").toLocaleDateString("pt-BR") : "—";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm break-words">{value && value.trim() ? value : "—"}</p>
  </div>
);

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </section>
);

/** Leitura das respostas de Pré-Chegada — carregada apenas sob demanda. */
const PreArrivalDetails = ({ reservationId, reservation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<AdminPreArrivalAnswers | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_pre_arrival_admin", {
        _reservation_id: reservationId,
      });
      if (!active) return;
      setLoading(false);
      if (error) {
        console.error("get_pre_arrival_admin", error);
        toast.error("Não foi possível carregar as respostas");
        return;
      }
      setAnswers(((data as unknown as AdminPreArrivalAnswers[]) || [])[0] || null);
    })();
    return () => {
      active = false;
    };
  }, [reservationId]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando respostas...
      </p>
    );
  }

  if (!answers) {
    return <p className="text-sm text-muted-foreground">Ainda sem respostas para esta reserva.</p>;
  }

  return (
    <div className="space-y-6">
      <Group title="Dados da reserva">
        <Field label="Hóspede" value={reservation?.guest_name} />
        <Field label="Acomodações" value={reservation?.rooms_summary} />
        <Field label="Período" value={`${fmtDate(reservation?.check_in)} → ${fmtDate(reservation?.check_out)}`} />
        <Field label="Hóspedes" value={reservation?.guests ? String(reservation.guests) : null} />
        <Field label="Respondido em" value={fmtDateTime(answers.answered_at)} />
        <Field label="Última atualização" value={fmtDateTime(answers.updated_at)} />
      </Group>

      <Group title="Alimentação">
        <Field label="Restrições alimentares" value={(answers.dietary_restrictions || []).join(", ")} />
        <Field label="Alimentos a evitar" value={answers.foods_to_avoid} />
      </Group>

      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <HeartPulse className="h-4 w-4 text-primary" />
          Saúde e Bem-Estar
        </h4>
        {answers.can_view_health ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Condição de saúde" value={answers.health_condition} />
            <Field label="Limitações de mobilidade" value={answers.mobility_limitations} />
            <Field label="Medicação contínua" value={answers.continuous_medication} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Informações de saúde visíveis apenas para o administrador principal.
          </p>
        )}
      </div>

      <Group title="Crianças">
        <Field label="Crianças na viagem" value={answers.children_info} />
      </Group>

      <Group title="Ocasião Especial">
        <Field label="Ocasião" value={answers.special_occasion} />
        <Field label="Detalhes" value={answers.special_occasion_detail} />
      </Group>

      <Group title="Informações Adicionais">
        <Field label="Observações do hóspede" value={answers.additional_info} />
      </Group>
    </div>
  );
};

export default PreArrivalDetails;
