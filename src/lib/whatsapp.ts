import { SOCIAL_LINKS } from '@/config/socialLinks';

/**
 * Cria um link do WhatsApp com mensagem pré-preenchida
 * @param message - Mensagem a ser enviada (será URL encoded automaticamente)
 * @returns URL completo do WhatsApp com a mensagem
 */
export const createWhatsAppLink = (message: string): string => {
  return `${SOCIAL_LINKS.whatsappBase}?text=${encodeURIComponent(message)}`;
};

/**
 * Cria um link do WhatsApp sem mensagem pré-preenchida
 * @returns URL do WhatsApp
 */
export const getWhatsAppLink = (): string => {
  return SOCIAL_LINKS.whatsapp;
};
