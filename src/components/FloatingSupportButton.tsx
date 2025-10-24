import { useState } from 'react';
import { MessageCircle, X, MessageSquare, HelpCircle, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

const FloatingSupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const whatsappNumber = '5592999999999'; // Replace with actual number
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de mais informações sobre as pousadas.');

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-forest shadow-strong hover:scale-110 transition-transform"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>{t('support.title')}</SheetTitle>
            <SheetDescription>
              {t('nav.contact')}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{t('support.whatsapp')}</p>
                <p className="text-sm text-muted-foreground">
                  Chat direto conosco
                </p>
              </div>
            </a>

            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to FAQ section or open FAQ dialog
              }}
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors w-full text-left"
            >
              <HelpCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{t('support.faq')}</p>
                <p className="text-sm text-muted-foreground">
                  Perguntas frequentes
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
              <Share2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{t('support.social')}</p>
                <div className="flex gap-2 mt-2">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Facebook
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FloatingSupportButton;
