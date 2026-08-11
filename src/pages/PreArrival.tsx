import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Leaf, MessageCircle, HeartPulse, Utensils, Baby, Gift, Info } from "lucide-react";
import { createWhatsAppLink } from "@/lib/whatsapp";

interface PreArrivalData {
  reservation_id: string;
  guest_name: string;
  reservation_code: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms_summary: string | null;
  guest_language: string;
  status: string;
  answered_at: string | null;
  dietary_restrictions: string[] | null;
  foods_to_avoid: string | null;
  children_info: string | null;
  special_occasion: string | null;
  special_occasion_detail: string | null;
  arrival_mode: string | null;
  estimated_arrival_time: string | null;
  transport_needs: string | null;
  additional_info: string | null;
  health_condition: string | null;
  mobility_limitations: string | null;
  continuous_medication: string | null;
}

const localeMap: Record<string, string> = {
  pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
};

const DIET_KEYS = ["none", "vegetarian", "vegan", "lactoseIntolerance", "celiac", "foodAllergy", "diabetic", "other"];
const OCCASION_KEYS = ["none", "birthday", "honeymoon", "anniversary", "other"];

const Section = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    {description && <p className="text-sm text-muted-foreground mb-4 md:ml-12">{description}</p>}
    <div className="space-y-4 mt-4 md:ml-12">{children}</div>
  </section>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <main className="container mx-auto max-w-3xl px-4 py-24 md:py-28">{children}</main>
    <Footer />
  </div>
);

const ChoiceWithDetail = ({
  name,
  value,
  onValueChange,
  detail,
  onDetailChange,
  yesLabel,
  noLabel,
  detailLabel,
  detailPlaceholder,
}: {
  name: string;
  value: "yes" | "no" | "";
  onValueChange: (value: "yes" | "no") => void;
  detail: string;
  onDetailChange: (value: string) => void;
  yesLabel: string;
  noLabel: string;
  detailLabel: string;
  detailPlaceholder: string;
}) => (
  <div className="space-y-3">
    <RadioGroup value={value} onValueChange={(next) => onValueChange(next as "yes" | "no")} className="flex gap-6">
      <label className="flex items-center gap-2 text-sm" htmlFor={`${name}-no`}>
        <RadioGroupItem id={`${name}-no`} value="no" />
        {noLabel}
      </label>
      <label className="flex items-center gap-2 text-sm" htmlFor={`${name}-yes`}>
        <RadioGroupItem id={`${name}-yes`} value="yes" />
        {yesLabel}
      </label>
    </RadioGroup>
    {value === "yes" && (
      <div>
        <Label htmlFor={`${name}-detail`}>{detailLabel}</Label>
        <Textarea
          id={`${name}-detail`}
          value={detail}
          maxLength={500}
          placeholder={detailPlaceholder}
          onChange={(event) => onDetailChange(event.target.value)}
        />
      </div>
    )}
  </div>
);

const PreArrival = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PreArrivalData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);


  const [diet, setDiet] = useState<string[]>([]);
  const [foodsToAvoid, setFoodsToAvoid] = useState("");
  const [childrenInfo, setChildrenInfo] = useState("");
  const [occasion, setOccasion] = useState("");
  const [occasionDetail, setOccasionDetail] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [healthCondition, setHealthCondition] = useState("");
  const [mobilityChoice, setMobilityChoice] = useState<"yes" | "no" | "">("");
  const [mobilityDetail, setMobilityDetail] = useState("");
  const [medicationChoice, setMedicationChoice] = useState<"yes" | "no" | "">("");
  const [medicationDetail, setMedicationDetail] = useState("");

  useEffect(() => {
    document.title = "Questionário de Pré-Chegada — Pousada Arara Azul";
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const previous = meta.content;
    meta.content = "noindex, nofollow";
    return () => {
      if (created) meta?.remove();
      else if (meta) meta.content = previous;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      const { data: rows, error } = await supabase.rpc("get_pre_arrival_by_token", { _token: token });
      if (error) console.error("get_pre_arrival_by_token", error);

      const row = (rows as PreArrivalData[] | null)?.[0] ?? null;
      if (row) {
        setData(row);
        if (row.guest_language && localeMap[row.guest_language]) {
          i18n.changeLanguage(row.guest_language);
        }
        setDiet((row.dietary_restrictions || []).map((item) => {
          if (item === "glutenFree") return "celiac";
          if (item === "lactoseFree") return "lactoseIntolerance";
          return item;
        }));
        setFoodsToAvoid(row.foods_to_avoid || "");
        setChildrenInfo(row.children_info || "");
        setOccasion(row.special_occasion || "");
        setOccasionDetail(row.special_occasion_detail || "");
        setAdditionalInfo(row.additional_info || "");
        setHealthCondition(row.health_condition || "");
        if (row.mobility_limitations) {
          const isNo = row.mobility_limitations.trim().toLowerCase() === "não";
          setMobilityChoice(isNo ? "no" : "yes");
          setMobilityDetail(isNo ? "" : row.mobility_limitations.replace(/^sim\s*[—:-]?\s*/i, ""));
        }
        if (row.continuous_medication) {
          const isNo = row.continuous_medication.trim().toLowerCase() === "não";
          setMedicationChoice(isNo ? "no" : "yes");
          setMedicationDetail(isNo ? "" : row.continuous_medication.replace(/^sim\s*[—:-]?\s*/i, ""));
        }
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString(localeMap[i18n.language] || "pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

  const toggleDiet = (key: string) =>
    setDiet((prev) => {
      if (key === "none") return prev.includes("none") ? [] : ["none"];
      const withoutNone = prev.filter((item) => item !== "none");
      return withoutNone.includes(key) ? withoutNone.filter((item) => item !== key) : [...withoutNone, key];
    });

  const normalizedMobility = mobilityChoice === "no"
    ? "Não"
    : mobilityChoice === "yes"
      ? `Sim${mobilityDetail.trim() ? ` — ${mobilityDetail.trim()}` : ""}`
      : "";
  const normalizedMedication = medicationChoice === "no"
    ? "Não"
    : medicationChoice === "yes"
      ? `Sim${medicationDetail.trim() ? ` — ${medicationDetail.trim()}` : ""}`
      : "";

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_pre_arrival", {
      _token: token,
      _language: i18n.language || "pt",
      _dietary_restrictions: diet,
      _foods_to_avoid: foodsToAvoid.trim().slice(0, 500) || null,
      _children_info: childrenInfo.trim().slice(0, 500) || null,
      _special_occasion: occasion || null,
      _special_occasion_detail: occasionDetail.trim().slice(0, 500) || null,
      _arrival_mode: null,
      _estimated_arrival_time: null,
      _transport_needs: null,
      _additional_info: additionalInfo.trim().slice(0, 1000) || null,
      _health_condition: healthCondition.trim().slice(0, 500) || null,
      _mobility_limitations: normalizedMobility.slice(0, 500) || null,
      _continuous_medication: normalizedMedication.slice(0, 500) || null,
    });
    setSubmitting(false);

    if (error) {
      console.error("submit_pre_arrival", error);
      toast({ title: t("preArrival.errorSave"), variant: "destructive" });
      return;
    }

    supabase.functions
      .invoke("notify-pre-arrival", { body: { token } })
      .catch((e) => console.error("notify-pre-arrival", e));

    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const whatsappLink = createWhatsAppLink(t("preArrival.whatsappMsg"));

  if (loading) {
    return (
      <Shell>
        <p className="text-center text-muted-foreground">{t("preArrival.loading")}</p>
      </Shell>
    );
  }

  if (!token || !data) {
    const expired = Boolean(token);
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Leaf className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {expired ? t("preArrival.expiredTitle") : t("preArrival.invalidTitle")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {expired ? t("preArrival.expiredDesc") : t("preArrival.invalidDesc")}
          </p>
          <Button asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("preArrival.whatsappBtn")}
            </a>
          </Button>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">{t("preArrival.successTitle")}</h1>
          <p className="text-muted-foreground mb-2">{t("preArrival.successDesc")}</p>
          <p className="text-sm text-muted-foreground">{t("preArrival.successUpdate")}</p>
        </div>
      </Shell>
    );
  }

  const alreadyAnswered = Boolean(data.answered_at);

  const steps = [

    {
      key: "food",
      node: (
        <Section icon={Utensils} title={t("preArrival.food.title")} description={t("preArrival.food.desc")}>
          <div>
            <Label className="mb-3 block">{t("preArrival.food.restrictions")}</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DIET_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={diet.includes(key)} onCheckedChange={() => toggleDiet(key)} />
                  {t(`preArrival.diet.${key}`)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="foods-avoid">{t("preArrival.food.avoid")}</Label>
            <Textarea
              id="foods-avoid"
              value={foodsToAvoid}
              maxLength={500}
              placeholder={t("preArrival.food.avoidPh")}
              onChange={(e) => setFoodsToAvoid(e.target.value)}
            />
          </div>
        </Section>
      ),
    },
    {
      key: "health",
      node: (
        <Section
          icon={HeartPulse}
          title={t("preArrival.health.title")}
          description={t("preArrival.health.notice")}
        >
          <div>
            <Label htmlFor="health-condition">{t("preArrival.health.condition")}</Label>
            <Textarea
              id="health-condition"
              value={healthCondition}
              maxLength={500}
              onChange={(e) => setHealthCondition(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mobility">{t("preArrival.health.mobility")}</Label>
            <ChoiceWithDetail
              name="mobility"
              value={mobilityChoice}
              onValueChange={(value) => {
                setMobilityChoice(value);
                if (value === "no") setMobilityDetail("");
              }}
              detail={mobilityDetail}
              onDetailChange={setMobilityDetail}
              yesLabel={t("preArrival.health.yes")}
              noLabel={t("preArrival.health.no")}
              detailLabel={t("preArrival.health.mobilityDetail")}
              detailPlaceholder={t("preArrival.health.mobilityPh")}
            />
          </div>
          <div>
            <Label htmlFor="medication">{t("preArrival.health.medication")}</Label>
            <ChoiceWithDetail
              name="medication"
              value={medicationChoice}
              onValueChange={(value) => {
                setMedicationChoice(value);
                if (value === "no") setMedicationDetail("");
              }}
              detail={medicationDetail}
              onDetailChange={setMedicationDetail}
              yesLabel={t("preArrival.health.yes")}
              noLabel={t("preArrival.health.no")}
              detailLabel={t("preArrival.health.medicationDetail")}
              detailPlaceholder={t("preArrival.health.medicationPh")}
            />
          </div>
        </Section>
      ),
    },
    {
      key: "kids",
      node: (
        <Section icon={Baby} title={t("preArrival.kids.title")}>
          {occasion && occasion !== "none" && <div>
            <Label htmlFor="children">{t("preArrival.kids.info")}</Label>
            <Textarea
              id="children"
              value={childrenInfo}
              maxLength={500}
              placeholder={t("preArrival.kids.infoPh")}
              onChange={(e) => setChildrenInfo(e.target.value)}
            />
          </div>}
        </Section>
      ),
    },
    {
      key: "occasion",
      node: (
        <Section icon={Gift} title={t("preArrival.occasion.title")}>
          <div>
            <Label>{t("preArrival.occasion.select")}</Label>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger>
                <SelectValue placeholder={t("preArrival.occasionOpts.none")} />
              </SelectTrigger>
              <SelectContent>
                {OCCASION_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`preArrival.occasionOpts.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="occasion-detail">{t("preArrival.occasion.detail")}</Label>
            <Textarea
              id="occasion-detail"
              value={occasionDetail}
              maxLength={500}
              placeholder={t("preArrival.occasion.detailPh")}
              onChange={(e) => setOccasionDetail(e.target.value)}
            />
          </div>
        </Section>
      ),
    },
    {
      key: "additional",
      node: (
        <Section icon={Info} title={t("preArrival.additional.title")}>
          <div>
            <Label htmlFor="additional">{t("preArrival.additional.info")}</Label>
            <Textarea
              id="additional"
              value={additionalInfo}
              maxLength={1000}
              placeholder={t("preArrival.additional.infoPh")}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        </Section>
      ),
    },
  ];

  const reviewIndex = steps.length;
  const totalSteps = steps.length + 1;
  const isReview = step === reviewIndex;

  const reviewItems: { step: number; title: string; lines: string[] }[] = [
    {
      step: 0,
      title: t("preArrival.food.title"),
      lines: [
        diet.length ? diet.map((k) => t(`preArrival.diet.${k}`)).join(", ") : "",
        foodsToAvoid,
      ].filter(Boolean),
    },
    {
      step: 1,
      title: t("preArrival.health.title"),
      lines: [healthCondition, normalizedMobility, normalizedMedication].filter(Boolean),
    },
    { step: 2, title: t("preArrival.kids.title"), lines: [childrenInfo].filter(Boolean) },
    {
      step: 3,
      title: t("preArrival.occasion.title"),
      lines: [occasion ? t(`preArrival.occasionOpts.${occasion}`) : "", occasionDetail].filter(Boolean),
    },
    { step: 4, title: t("preArrival.additional.title"), lines: [additionalInfo].filter(Boolean) },
  ];

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Shell>
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Leaf className="h-4 w-4" />
          {t("preArrival.title")}
        </span>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground">
          {t("preArrival.pageTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{data.guest_name} · {t("preArrival.subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border bg-muted/40 p-5 mb-6">
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">{t("preArrival.reservation")}</dt>
            <dd className="font-medium text-foreground">{data.reservation_code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.guests")}</dt>
            <dd className="font-medium text-foreground">{data.guests}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.bungalows")}</dt>
            <dd className="font-medium text-foreground">{data.rooms_summary || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.checkIn")}</dt>
            <dd className="font-medium text-foreground">{formatDate(data.check_in)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.checkOut")}</dt>
            <dd className="font-medium text-foreground">{formatDate(data.check_out)}</dd>
          </div>
        </dl>
      </div>

      {step === 0 && (
        <p className="mb-6 text-muted-foreground leading-relaxed">{t("preArrival.intro")}</p>
      )}

      {alreadyAnswered && step === 0 && (
        <p className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
          {t("preArrival.answeredBadge")}
        </p>
      )}

      {/* Progresso */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("preArrival.nav.step", { current: step + 1, total: totalSteps })}</span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div key={step} className="animate-fade-in">
        {isReview ? (
          <Section icon={CheckCircle} title={t("preArrival.review.title")} description={t("preArrival.review.desc")}>
            <div className="space-y-4">
              {reviewItems.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <Button variant="ghost" size="sm" onClick={() => goTo(item.step)}>
                      {t("preArrival.review.edit")}
                    </Button>
                  </div>
                  {item.lines.length ? (
                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                      {item.lines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">{t("preArrival.review.empty")}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ) : (
          steps[step].node
        )}
      </div>

      {isReview && (
        <p className="mt-8 text-center text-muted-foreground">{t("preArrival.closing")}</p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={() => goTo(step - 1)}
          disabled={step === 0 || submitting}
          className={step === 0 ? "invisible" : ""}
        >
          {t("preArrival.nav.back")}
        </Button>

        {isReview ? (
          <Button size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? t("preArrival.submitting")
              : alreadyAnswered
                ? t("preArrival.update")
                : t("preArrival.submit")}
          </Button>
        ) : (
          <Button size="lg" onClick={() => goTo(step + 1)}>
            {step === steps.length - 1 ? t("preArrival.nav.review") : t("preArrival.nav.next")}
          </Button>
        )}
      </div>
    </Shell>
  );
};


export default PreArrival;
