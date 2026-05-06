import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const [step, setStep] = useState<"validate" | "form" | "success">("validate");
  const [reservationId, setReservationId] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenUsed] = useState(tokenFromUrl || "");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [issues, setIssues] = useState("");

  useEffect(() => {
    if (tokenFromUrl) validateToken(tokenFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateToken(token: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_booking_token", {
      p_token: token, p_type: "checkout",
    });
    if (error || !data || data.length === 0) {
      toast({ title: t("checkoutPage.tokenInvalid"), variant: "destructive" });
    } else {
      const r = data[0];
      if (r.checkout_completed) {
        toast({ title: t("checkoutPage.alreadyDone") });
      } else {
        setReservation({
          id: r.reservation_id, guest_name: r.guest_name, room_name: r.room_name,
          check_in: r.check_in, check_out: r.check_out, checkout_completed: r.checkout_completed,
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
      p_reservation_id: reservationId.trim(), p_email: email.trim(),
    });
    if (error || !data || data.length === 0) {
      toast({ title: t("checkoutPage.reservationNotFound"), variant: "destructive" });
    } else {
      const r = data[0];
      if (r.checkout_completed) {
        toast({ title: t("checkoutPage.alreadyDone") });
      } else {
        setReservation({
          id: r.id, guest_name: r.guest_name, room_name: r.room_name,
          check_in: r.check_in, check_out: r.check_out, checkout_completed: r.checkout_completed,
        });
        setStep("form");
      }
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: t("checkoutPage.selectRating"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("submit_checkout", {
      p_reservation_id: reservation!.id, p_rating: rating,
      p_comment: comment.trim() || null, p_issues: issues.trim() || null,
      p_token: tokenUsed || null,
    });
    if (error) {
      toast({ title: t("checkoutPage.errorSubmit"), description: error.message, variant: "destructive" });
    } else {
      if (rating < 4) {
        try {
          await supabase.functions.invoke("send-internal-feedback", {
            body: { reservationId: reservation!.id, rating, comment, issues },
          });
        } catch {}
      }
      setStep("success");
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
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{t("checkoutPage.title")}</h1>
                <p className="text-muted-foreground mt-2">{t("checkoutPage.subtitle")}</p>
              </div>
              <form onSubmit={handleValidate} className="space-y-4">
                <div>
                  <Label htmlFor="rid">{t("checkoutPage.reservationCode")}</Label>
                  <Input id="rid" value={reservationId} onChange={(e) => setReservationId(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="em">{t("checkoutPage.email")}</Label>
                  <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading}>
                  {loading ? t("checkoutPage.verifying") : t("checkoutPage.continue")}
                </Button>
              </form>
            </div>
          )}

          {step === "form" && reservation && (
            <div className="bg-card rounded-xl shadow-soft p-6 sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-display font-bold text-foreground">{t("checkoutPage.howWasStay", { name: reservation.guest_name })}</h1>
                <p className="text-muted-foreground mt-1">{reservation.room_name}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center">
                  <Label className="mb-3 block">{t("checkoutPage.ratingLabel")} *</Label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} type="button" onClick={() => setRating(v)}
                        onMouseEnter={() => setHoverRating(v)} onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110">
                        <Star className={`h-8 w-8 ${v <= (hoverRating || rating) ? "text-[hsl(var(--golden))] fill-[hsl(var(--golden))]" : "text-muted"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="comment">{t("checkoutPage.commentLabel")}</Label>
                  <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder={t("checkoutPage.commentPh")} maxLength={1000} rows={3} />
                </div>
                <div>
                  <Label htmlFor="issues">{t("checkoutPage.issuesLabel")}</Label>
                  <Textarea id="issues" value={issues} onChange={(e) => setIssues(e.target.value)}
                    placeholder={t("checkoutPage.issuesPh")} maxLength={1000} rows={3} />
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading || rating === 0}>
                  {loading ? t("checkoutPage.sending") : t("checkoutPage.submit")}
                </Button>
              </form>
            </div>
          )}

          {step === "success" && (
            <div className="bg-card rounded-xl shadow-soft p-8 sm:p-12 text-center space-y-6">
              <Heart className="h-16 w-16 text-destructive mx-auto" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                {t("checkoutPage.thankYou", { name: reservation?.guest_name })}
              </h1>
              <p className="text-lg text-muted-foreground">{t("checkoutPage.successLead")}</p>

              {comment.trim() && (
                <div className="bg-muted/30 rounded-lg p-4 text-left">
                  <p className="text-sm font-medium text-foreground mb-1">{t("checkoutPage.yourComment")}</p>
                  <p className="text-sm text-muted-foreground italic">"{comment}"</p>
                </div>
              )}

              <div className="pt-2">
                <p className="text-base text-muted-foreground mb-4">{t("checkoutPage.shareGoogle")}</p>
                <button type="button" onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center justify-center gap-3 w-full sm:w-auto h-14 px-8 bg-white border-2 border-[#34A853] text-foreground font-semibold rounded-xl shadow-md hover:shadow-xl hover:scale-[1.03] hover:border-[#2d9249] transition-all duration-300 ease-out active:scale-[0.98] cursor-pointer">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {t("checkoutPage.reviewBtn")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
