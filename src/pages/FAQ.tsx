import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { createWhatsAppLink } from "@/lib/whatsapp";

const FAQ = () => {
  const { t } = useTranslation();
  usePageMeta({
    title: t('pages.faqTitle'),
    description: t('pages.faqDesc'),
  });

  const faqItems = [
    {
      question: t("faq.checkInTime.question"),
      answer: t("faq.checkInTime.answer"),
    },
    {
      question: t("faq.vaccines.question"),
      answer: t("faq.vaccines.answer"),
    },
    {
      question: t("faq.transfer.question"),
      answer: t("faq.transfer.answer"),
    },
    {
      question: t("faq.cancellation.question"),
      answer: t("faq.cancellation.answer"),
    },
    {
      question: t("faq.payment.question"),
      answer: t("faq.payment.answer"),
    },
    {
      question: t("faq.amenities.question"),
      answer: t("faq.amenities.answer"),
    },
    {
      question: t("faq.activities.question"),
      answer: t("faq.activities.answer"),
    },
    {
      question: t("faq.contact.question"),
      answer: t("faq.contact.answer"),
    },
  ];

  const whatsappUrl = createWhatsAppLink(t('whatsapp.faqQuestion'));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-3 sm:mb-4">
              {t("faq.title")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t("faq.subtitle")}</p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-4 sm:px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                  <span className="font-semibold text-foreground text-sm sm:text-base">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-3 sm:pb-4 text-sm sm:text-base">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact CTA */}
          <div className="mt-10 sm:mt-16 text-center bg-muted/30 rounded-lg p-5 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3 sm:mb-4">
              {t("faq.stillHaveQuestions")}
            </h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{t("faq.contactUs")}</p>
            <Button size="lg" className="bg-gradient-forest hover:opacity-90" asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t("faq.whatsappButton")}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
