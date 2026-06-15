import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import DeveloperCreditModal from "@/components/DeveloperCreditModal";
import { Code2 } from "lucide-react";

const Contact = () => {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Contato | Pousada Arara Azul – Manacapuru, AM',
    description: 'Entre em contato com a Pousada Arara Azul. WhatsApp, e-mail e endereço para reservas e informações sobre hospedagem na Amazônia.',
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
        },
      ]);

      if (error) throw error;

      supabase.functions.invoke("send-internal-notification", {
        body: {
          type: "new_message",
          data: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            message: formData.message,
          },
        },
      }).catch(() => {});

      toast.success(t("contact.successToast"));
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error(t("contact.errorToast"));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              {t("contact.title")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t("contact.heroSubtitle")}
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 sm:mb-2">{t("contact.phoneTitle")}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">WhatsApp: +55 92 9 8412-5475</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 sm:mb-2">{t("contact.emailTitle")}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground break-all sm:break-normal">adm@pousadararazul.com</p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-all sm:break-normal">reservas@pousadararazul.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 sm:mb-2">{t("contact.addressTitle")}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("contact.addressLine1")}
                        <br />
                        {t("contact.addressLine2")}
                        <br />
                        {t("contact.addressLine3")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-forest text-white">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold mb-1 sm:mb-2">{t("contact.hoursTitle")}</h3>
                  <p className="text-xs sm:text-sm opacity-90">{t("contact.hoursWeek")}</p>
                  <p className="text-xs sm:text-sm opacity-90">{t("contact.hoursSat")}</p>
                  <p className="text-xs sm:text-sm opacity-90">{t("contact.hoursSun")}</p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <h2 className="text-xl sm:text-2xl font-display font-semibold mb-4 sm:mb-6 text-foreground">
                    {t("contact.sendMessage")}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        {t("contact.fullName")}
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t("contact.namePlaceholder")}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        {t("contact.email")}
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t("contact.emailPlaceholder")}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-2">
                        {t("contact.phoneOptional")}
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t("contact.phonePlaceholder")}
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        {t("contact.message")}
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={t("contact.messagePlaceholder")}
                        rows={5}
                        className="min-h-[120px] sm:min-h-[150px]"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90 h-11 sm:h-12 text-base sm:text-lg">
                      <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {t("contact.send")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Developer Credit Section */}
          <div className="max-w-6xl mx-auto mt-10 sm:mt-14">
            <Card className="border-border/60">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-forest flex items-center justify-center flex-shrink-0">
                    <Code2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      {t("developer.sectionTitle")}
                    </p>
                    <DeveloperCreditModal>
                      <button
                        type="button"
                        className="text-left group"
                      >
                        <h3 className="font-display font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                          Flávio A. Costa
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {t("developer.shortDescription")}
                        </p>
                      </button>
                    </DeveloperCreditModal>
                  </div>
                  <DeveloperCreditModal>
                    <Button variant="outline" size="sm" className="flex-shrink-0 w-full sm:w-auto">
                      {t("developer.learnMore")}
                    </Button>
                  </DeveloperCreditModal>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
