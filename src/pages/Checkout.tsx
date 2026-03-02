import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Heart, Leaf } from "lucide-react";

const GOOGLE_PLACE_ID = import.meta.env.VITE_GOOGLE_PLACE_ID || "ChIJIZ49U-RjbJIRfRcHewbwWdE";

interface ReservationInfo {
  id: string;
  guest_name: string;
  room_name: string;
  check_in: string;
  check_out: string;
  checkout_completed: boolean;
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const { toast } = useToast();

  const [step, setStep] = useState<"validate" | "form" | "success_high" | "success_low">("validate");
  const [reservationId, setReservationId] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenUsed, setTokenUsed] = useState(tokenFromUrl || "");

  // Form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [issues, setIssues] = useState("");

  useState(() => {
    if (tokenFromUrl) validateToken(tokenFromUrl);
  });

  async function validateToken(token: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_booking_token", {
      p_token: token,
      p_type: "checkout",
    });
    if (error || !data || data.length === 0) {
      toast({ title: "Token inválido ou expirado", variant: "destructive" });
    } else {
      const r = data[0];
      if (r.checkout_completed) {
        toast({ title: "Check-out já realizado" });
      } else {
        setReservation({
          id: r.reservation_id,
          guest_name: r.guest_name,
          room_name: r.room_name,
          check_in: r.check_in,
          check_out: r.check_out,
          checkout_completed: r.checkout_completed,
        });
        setStep("form");
      }
    }
    setLoading(false);
  }

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_reservation_for_guest", {
      p_reservation_id: reservationId.trim(),
      p_email: email.trim(),
    });
    if (error || !data || data.length === 0) {
      toast({ title: "Reserva não encontrada", variant: "destructive" });
    } else {
      const r = data[0];
      if (r.checkout_completed) {
        toast({ title: "Check-out já realizado" });
      } else {
        setReservation({
          id: r.id,
          guest_name: r.guest_name,
          room_name: r.room_name,
          check_in: r.check_in,
          check_out: r.check_out,
          checkout_completed: r.checkout_completed,
        });
        setStep("form");
      }
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Selecione uma nota", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = await supabase.rpc("submit_checkout", {
      p_reservation_id: reservation!.id,
      p_rating: rating,
      p_comment: comment.trim() || null,
      p_issues: issues.trim() || null,
      p_token: tokenUsed || null,
    });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      if (rating >= 4) {
        setStep("success_high");
      } else {
        // trigger internal feedback email
        try {
          await supabase.functions.invoke("send-internal-feedback", {
            body: { reservationId: reservation!.id, rating, comment, issues },
          });
        } catch {}
        setStep("success_low");
      }
    }
    setLoading(false);
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {step === "validate" && (
            <div className="bg-card rounded-xl shadow-soft p-6 sm:p-8">
              <div className="text-center mb-6">
                <Leaf className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Check-out Digital</h1>
                <p className="text-muted-foreground mt-2">Conte como foi sua experiência</p>
              </div>
              <form onSubmit={handleValidate} className="space-y-4">
                <div>
                  <Label htmlFor="rid">Código da Reserva</Label>
                  <Input id="rid" value={reservationId} onChange={(e) => setReservationId(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="em">Email</Label>
                  <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading}>
                  {loading ? "Verificando..." : "Continuar"}
                </Button>
              </form>
            </div>
          )}

          {step === "form" && reservation && (
            <div className="bg-card rounded-xl shadow-soft p-6 sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-display font-bold text-foreground">{reservation.guest_name}, como foi sua estadia?</h1>
                <p className="text-muted-foreground mt-1">{reservation.room_name}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Rating */}
                <div className="text-center">
                  <Label className="mb-3 block">Nota geral *</Label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRating(v)}
                        onMouseEnter={() => setHoverRating(v)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            v <= (hoverRating || rating)
                              ? "text-[hsl(var(--golden))] fill-[hsl(var(--golden))]"
                              : "text-muted"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="comment">Comentário (opcional)</Label>
                  <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="O que mais gostou?" maxLength={1000} rows={3} />
                </div>
                <div>
                  <Label htmlFor="issues">Problemas enfrentados (opcional)</Label>
                  <Textarea id="issues" value={issues} onChange={(e) => setIssues(e.target.value)} placeholder="Algo que possamos melhorar?" maxLength={1000} rows={3} />
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading || rating === 0}>
                  {loading ? "Enviando..." : "Confirmar Check-out"}
                </Button>
              </form>
            </div>
          )}

          {step === "success_high" && (
            <div className="bg-card rounded-xl shadow-soft p-8 sm:p-12 text-center">
              <Heart className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
                Obrigado, {reservation?.guest_name}!
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Ficamos muito felizes que você teve uma ótima experiência!
                Que tal compartilhar no Google para ajudar outros viajantes?
              </p>
              <Button
                size="lg"
                className="bg-gradient-forest hover:opacity-90 cursor-pointer"
                onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
              >
                <Star className="mr-2 h-5 w-5" />
                Avaliar no Google
              </Button>
            </div>
          )}

          {step === "success_low" && (
            <div className="bg-card rounded-xl shadow-soft p-8 sm:p-12 text-center">
              <Leaf className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
                Agradecemos seu feedback, {reservation?.guest_name}
              </h1>
              <p className="text-lg text-muted-foreground">
                Nossa equipe entrará em contato para entender melhor como podemos melhorar sua experiência. Obrigado por nos ajudar a crescer.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
