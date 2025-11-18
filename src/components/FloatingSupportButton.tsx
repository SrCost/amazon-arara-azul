import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { SOCIAL_LINKS } from '@/config/socialLinks';

const FloatingSupportButton = () => {
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de mais informações sobre os bangalôs.');

  return (
    <a
      href={`${SOCIAL_LINKS.whatsapp}?text=${whatsappMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-strong hover:scale-110 transition-transform"
        size="icon"
      >
        <MessageCircle className="h-8 w-8 text-white stroke-[2.5]" />
      </Button>
    </a>
  );
};

export default FloatingSupportButton;
