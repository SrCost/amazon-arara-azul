import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Linkedin, ExternalLink, Code2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeveloperCreditModalProps {
  children: ReactNode;
}

const DEV_EMAIL = "flavio.cost@live.com";
const DEV_LINKEDIN = "https://www.linkedin.com/in/flavio-cost/";
const DEV_NAME = "Flávio A. Costa";

const DeveloperCreditModal = ({ children }: DeveloperCreditModalProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border-border">
        {/* Header with gradient */}
        <div className="bg-gradient-forest text-white p-6 pb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <DialogHeader className="space-y-0.5 text-left">
                <DialogTitle className="text-xl sm:text-2xl font-display font-bold text-white">
                  {DEV_NAME}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs sm:text-sm">
                  {t("developer.role")}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 pt-5 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("developer.description")}
          </p>

          <div className="space-y-2">
            <a
              href={`mailto:${DEV_EMAIL}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  {t("developer.emailLabel")}
                </p>
                <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {DEV_EMAIL}
                </p>
              </div>
            </a>

            <a
              href={DEV_LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Linkedin className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  {t("developer.linkedinLabel")}
                </p>
                <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  linkedin.com/in/flavio-cost
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          </div>

          <DialogClose asChild>
            <Button variant="outline" className="w-full">
              {t("developer.close")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperCreditModal;
