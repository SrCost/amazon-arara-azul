import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPPORTED = ["pt", "en", "es", "fr", "de"] as const;
type Lang = (typeof SUPPORTED)[number];
const STORAGE_KEY = "langSuggestionDismissed";

const labelByLang: Record<Lang, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

const detectBrowserLang = (): Lang | null => {
  if (typeof navigator === "undefined") return null;
  const list = [navigator.language, ...(navigator.languages ?? [])];
  for (const raw of list) {
    const code = raw?.toLowerCase().split("-")[0] as Lang;
    if (SUPPORTED.includes(code)) return code;
  }
  return null;
};

/**
 * Discreet banner suggesting the user switch to the language detected from
 * their browser, when it differs from the active i18n language.
 */
const LanguageSuggestionBanner = () => {
  const { i18n, t } = useTranslation();
  const [suggested, setSuggested] = useState<Lang | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    const detected = detectBrowserLang();
    if (!detected) return;
    const current = (i18n.language || "pt").split("-")[0];
    if (detected !== current) setSuggested(detected);
  }, [i18n.language]);

  if (!suggested) return null;

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setSuggested(null);
  };

  const accept = () => {
    i18n.changeLanguage(suggested);
    window.localStorage.setItem(STORAGE_KEY, "1");
    setSuggested(null);
  };

  // Fetch the message in the suggested language so the user can read it.
  const message = i18n.getFixedT(suggested)("languageSuggestion.message", {
    defaultValue: `Switch to ${labelByLang[suggested]}?`,
  });
  const switchLabel = i18n.getFixedT(suggested)("languageSuggestion.switch", {
    defaultValue: "Switch",
  });
  const dismissLabel = t("languageSuggestion.dismiss", { defaultValue: "Dismiss" });

  return (
    <div
      role="region"
      aria-label="Language suggestion"
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-border bg-card/95 p-3 shadow-strong backdrop-blur-sm sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm text-foreground">{message}</p>
        <button
          onClick={dismiss}
          aria-label={dismissLabel}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex justify-end">
        <Button size="sm" variant="default" onClick={accept}>
          {switchLabel} → {labelByLang[suggested]}
        </Button>
      </div>
    </div>
  );
};

export default LanguageSuggestionBanner;
