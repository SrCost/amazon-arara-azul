import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOGO_URL = "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/logo-arara-azul.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: 'payment_success' | 'payment_error' | 'reservation_confirmed';
  reservationId: string;
  email: string;
  name: string;
  force?: boolean;
  errorMessage?: string;
  lang?: string;
  paymentDetails?: {
    method: string;
    amount: number;
    status: string;
    paymentId?: string;
  };
}

type Lang = 'pt' | 'en' | 'es' | 'fr' | 'de';
const SUPPORTED_LANGS: Lang[] = ['pt','en','es','fr','de'];
const normalizeLang = (l?: string): Lang => {
  const v = (l || 'pt').toLowerCase().split('-')[0] as Lang;
  return SUPPORTED_LANGS.includes(v) ? v : 'pt';
};

const LOCALE_MAP: Record<Lang, string> = {
  pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
};
const CURRENCY_LOCALE: Record<Lang, string> = {
  pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
};

const I18N = {
  pt: {
    subjectConfirmed: '🌿 Reserva confirmada – Pousada Arara Azul',
    subjectPaid: '✓ Pagamento Aprovado – Pousada Arara Azul',
    subjectError: 'Atenção: Erro no Pagamento – Pousada Arara Azul',
    confirmedTitle: 'Reserva Confirmada',
    confirmedSubtitle: 'Uma experiência exclusiva espera por você',
    hello: 'Olá',
    confirmedIntro: 'Sua reserva foi confirmada com sucesso. Estamos preparando cada detalhe da sua estadia.',
    daysLeft: 'Faltam',
    daysToArrival: 'dias para sua chegada 🌿',
    code: 'Código', bungalow: 'Bangalô', checkin: 'Check-in', checkout: 'Check-out', total: 'Valor Total',
    addCalendar: 'Adicionar ao Google Calendar',
    upgradeTitle: 'Upgrade Exclusivo',
    upgradeText: 'Deseja elevar sua experiência? Disponibilizamos upgrade de bangalô com vista privilegiada e comodidades especiais.',
    upgradeBtn: 'Ver Upgrade Disponível',
    tourTitle: 'Experiência na Amazônia',
    tourText: 'Passeios exclusivos pela floresta, focagem noturna de jacarés e visita às comunidades locais. Vagas limitadas.',
    tourBtn: 'Reservar Passeio',
    cancelTitle: '📋 Política de Cancelamento',
    cancelText: 'Cancelamento com até 30 dias: reembolso parcial conforme política. Menos de 7 dias do check-in ou no-show: sem reembolso.',
    cancelLink: 'Ver política completa (PDF)',
    contactTeam: 'Falar com nossa equipe',
    thanks: 'Agradecemos sua confiança.',
    team: 'Equipe Pousada Arara Azul',
    paidTitle: 'Pagamento Aprovado ✓',
    paidIntro: 'Seu pagamento foi processado com sucesso! Em breve você receberá o email de confirmação da sua reserva com todos os detalhes.',
    paymentDetails: '💳 Detalhes do Pagamento',
    method: 'Método', amount: 'Valor', txId: 'ID da Transação', date: 'Data',
    paid: 'Pagamento Aprovado',
    methodPix: 'PIX', methodCard: 'Cartão de Crédito',
    helpQuestions: 'Em caso de dúvidas:',
    errorTitle: 'Atenção: Erro no Pagamento',
    errorIntro: 'Infelizmente ocorreu um problema ao processar seu pagamento. Não se preocupe, nenhum valor foi cobrado.',
    errorReason: '⚠️ Motivo do Erro',
    errorUnknown: 'Erro desconhecido no processamento do pagamento',
    notProcessed: '✗ Pagamento Não Processado',
    whatToDo: 'O que fazer?',
    todo1: 'Verifique os dados do cartão e tente novamente',
    todo2: 'Tente usar outro método de pagamento (PIX ou outro cartão)',
    todo3: 'Entre em contato conosco para assistência',
    needHelp: 'Precisa de ajuda? Estamos aqui:',
    rights: 'Todos os direitos reservados',
    waUpgrade: (c: string) => `Olá! Tenho a reserva ${c} e gostaria de saber sobre upgrade de bangalô.`,
    waTour: (c: string) => `Olá! Tenho a reserva ${c} e gostaria de reservar passeios para complementar minha experiência na Amazônia.`,
    waTeam: (c: string) => `Olá! Tenho a reserva ${c} e gostaria de mais informações.`,
  },
  en: {
    subjectConfirmed: 'Booking confirmed – Pousada Arara Azul',
    subjectPaid: 'Payment Approved – Pousada Arara Azul',
    subjectError: 'Attention: Payment Error – Pousada Arara Azul',
    confirmedTitle: 'Booking Confirmed',
    confirmedSubtitle: 'An exclusive experience awaits you',
    hello: 'Hello',
    confirmedIntro: 'Your booking has been successfully confirmed. We are preparing every detail of your stay.',
    daysLeft: 'Only',
    daysToArrival: 'days until your arrival 🌿',
    code: 'Code', bungalow: 'Bungalow', checkin: 'Check-in', checkout: 'Check-out', total: 'Total Amount',
    addCalendar: 'Add to Google Calendar',
    upgradeTitle: 'Exclusive Upgrade',
    upgradeText: 'Want to elevate your experience? We offer bungalow upgrades with privileged views and special amenities.',
    upgradeBtn: 'See Available Upgrade',
    tourTitle: 'Amazon Experience',
    tourText: 'Exclusive forest tours, nighttime caiman spotting and visits to local communities. Limited spots.',
    tourBtn: 'Book Tour',
    cancelTitle: '📋 Cancellation Policy',
    cancelText: 'Cancellation up to 30 days: partial refund as per policy. Less than 7 days before check-in or no-show: no refund.',
    cancelLink: 'See full policy (PDF)',
    contactTeam: 'Contact our team',
    thanks: 'Thank you for your trust.',
    team: 'Pousada Arara Azul Team',
    paidTitle: 'Payment Approved ✓',
    paidIntro: 'Your payment was processed successfully! You will soon receive your booking confirmation email with all details.',
    paymentDetails: '💳 Payment Details',
    method: 'Method', amount: 'Amount', txId: 'Transaction ID', date: 'Date',
    paid: 'Payment Approved',
    methodPix: 'PIX', methodCard: 'Credit Card',
    helpQuestions: 'Any questions?',
    errorTitle: 'Attention: Payment Error',
    errorIntro: 'Unfortunately there was a problem processing your payment. Do not worry, no amount was charged.',
    errorReason: '⚠️ Error Reason',
    errorUnknown: 'Unknown error processing payment',
    notProcessed: '✗ Payment Not Processed',
    whatToDo: 'What to do?',
    todo1: 'Check your card details and try again',
    todo2: 'Try another payment method (PIX or another card)',
    todo3: 'Contact us for assistance',
    needHelp: 'Need help? We are here:',
    rights: 'All rights reserved',
    waUpgrade: (c: string) => `Hello! I have booking ${c} and would like to know about a bungalow upgrade.`,
    waTour: (c: string) => `Hello! I have booking ${c} and would like to book tours to complement my Amazon experience.`,
    waTeam: (c: string) => `Hello! I have booking ${c} and would like more information.`,
  },
  es: {
    subjectConfirmed: '🌿 Reserva confirmada – Pousada Arara Azul',
    subjectPaid: '✓ Pago Aprobado – Pousada Arara Azul',
    subjectError: 'Atención: Error de Pago – Pousada Arara Azul',
    confirmedTitle: 'Reserva Confirmada',
    confirmedSubtitle: 'Una experiencia exclusiva te espera',
    hello: 'Hola',
    confirmedIntro: 'Tu reserva ha sido confirmada con éxito. Estamos preparando cada detalle de tu estadía.',
    daysLeft: 'Faltan',
    daysToArrival: 'días para tu llegada 🌿',
    code: 'Código', bungalow: 'Bungaló', checkin: 'Check-in', checkout: 'Check-out', total: 'Valor Total',
    addCalendar: 'Añadir a Google Calendar',
    upgradeTitle: 'Upgrade Exclusivo',
    upgradeText: '¿Quieres elevar tu experiencia? Ofrecemos upgrade de bungaló con vista privilegiada y comodidades especiales.',
    upgradeBtn: 'Ver Upgrade Disponible',
    tourTitle: 'Experiencia en la Amazonia',
    tourText: 'Paseos exclusivos por la selva, observación nocturna de caimanes y visita a las comunidades locales. Plazas limitadas.',
    tourBtn: 'Reservar Paseo',
    cancelTitle: '📋 Política de Cancelación',
    cancelText: 'Cancelación hasta 30 días: reembolso parcial según política. Menos de 7 días del check-in o no-show: sin reembolso.',
    cancelLink: 'Ver política completa (PDF)',
    contactTeam: 'Hablar con nuestro equipo',
    thanks: 'Agradecemos tu confianza.',
    team: 'Equipo Pousada Arara Azul',
    paidTitle: 'Pago Aprobado ✓',
    paidIntro: '¡Tu pago se procesó con éxito! Pronto recibirás el email de confirmación de tu reserva con todos los detalles.',
    paymentDetails: '💳 Detalles del Pago',
    method: 'Método', amount: 'Importe', txId: 'ID de Transacción', date: 'Fecha',
    paid: 'Pago Aprobado',
    methodPix: 'PIX', methodCard: 'Tarjeta de Crédito',
    helpQuestions: '¿Tienes dudas?',
    errorTitle: 'Atención: Error de Pago',
    errorIntro: 'Lamentablemente hubo un problema al procesar tu pago. No te preocupes, no se cobró ningún importe.',
    errorReason: '⚠️ Motivo del Error',
    errorUnknown: 'Error desconocido al procesar el pago',
    notProcessed: '✗ Pago No Procesado',
    whatToDo: '¿Qué hacer?',
    todo1: 'Verifica los datos de la tarjeta e intenta de nuevo',
    todo2: 'Prueba otro método de pago (PIX u otra tarjeta)',
    todo3: 'Contáctanos para asistencia',
    needHelp: '¿Necesitas ayuda? Estamos aquí:',
    rights: 'Todos los derechos reservados',
    waUpgrade: (c: string) => `¡Hola! Tengo la reserva ${c} y me gustaría saber sobre el upgrade de bungaló.`,
    waTour: (c: string) => `¡Hola! Tengo la reserva ${c} y me gustaría reservar paseos para complementar mi experiencia en la Amazonia.`,
    waTeam: (c: string) => `¡Hola! Tengo la reserva ${c} y me gustaría más información.`,
  },
  fr: {
    subjectConfirmed: '🌿 Réservation confirmée – Pousada Arara Azul',
    subjectPaid: '✓ Paiement Approuvé – Pousada Arara Azul',
    subjectError: 'Attention : Erreur de Paiement – Pousada Arara Azul',
    confirmedTitle: 'Réservation Confirmée',
    confirmedSubtitle: 'Une expérience exclusive vous attend',
    hello: 'Bonjour',
    confirmedIntro: 'Votre réservation a été confirmée avec succès. Nous préparons chaque détail de votre séjour.',
    daysLeft: 'Plus que',
    daysToArrival: 'jours avant votre arrivée 🌿',
    code: 'Code', bungalow: 'Bungalow', checkin: 'Arrivée', checkout: 'Départ', total: 'Montant Total',
    addCalendar: 'Ajouter à Google Agenda',
    upgradeTitle: 'Surclassement Exclusif',
    upgradeText: 'Souhaitez-vous rehausser votre expérience ? Nous proposons un surclassement de bungalow avec vue privilégiée et équipements spéciaux.',
    upgradeBtn: 'Voir le Surclassement',
    tourTitle: 'Expérience en Amazonie',
    tourText: 'Excursions exclusives en forêt, observation nocturne des caïmans et visites des communautés locales. Places limitées.',
    tourBtn: 'Réserver une Excursion',
    cancelTitle: '📋 Politique d’Annulation',
    cancelText: 'Annulation jusqu’à 30 jours : remboursement partiel selon la politique. Moins de 7 jours avant l’arrivée ou no-show : aucun remboursement.',
    cancelLink: 'Voir la politique complète (PDF)',
    contactTeam: 'Contacter notre équipe',
    thanks: 'Merci de votre confiance.',
    team: 'Équipe Pousada Arara Azul',
    paidTitle: 'Paiement Approuvé ✓',
    paidIntro: 'Votre paiement a été traité avec succès ! Vous recevrez bientôt l’email de confirmation de votre réservation avec tous les détails.',
    paymentDetails: '💳 Détails du Paiement',
    method: 'Méthode', amount: 'Montant', txId: 'ID de Transaction', date: 'Date',
    paid: 'Paiement Approuvé',
    methodPix: 'PIX', methodCard: 'Carte de Crédit',
    helpQuestions: 'Des questions ?',
    errorTitle: 'Attention : Erreur de Paiement',
    errorIntro: 'Malheureusement, un problème est survenu lors du traitement de votre paiement. Pas d’inquiétude, aucun montant n’a été débité.',
    errorReason: '⚠️ Raison de l’Erreur',
    errorUnknown: 'Erreur inconnue lors du traitement du paiement',
    notProcessed: '✗ Paiement Non Traité',
    whatToDo: 'Que faire ?',
    todo1: 'Vérifiez les informations de la carte et réessayez',
    todo2: 'Essayez un autre mode de paiement (PIX ou une autre carte)',
    todo3: 'Contactez-nous pour assistance',
    needHelp: 'Besoin d’aide ? Nous sommes là :',
    rights: 'Tous droits réservés',
    waUpgrade: (c: string) => `Bonjour ! J'ai la réservation ${c} et j'aimerais en savoir plus sur le surclassement de bungalow.`,
    waTour: (c: string) => `Bonjour ! J'ai la réservation ${c} et j'aimerais réserver des excursions pour compléter mon expérience en Amazonie.`,
    waTeam: (c: string) => `Bonjour ! J'ai la réservation ${c} et j'aimerais plus d'informations.`,
  },
  de: {
    subjectConfirmed: 'Buchung bestätigt – Pousada Arara Azul',
    subjectPaid: 'Zahlung genehmigt – Pousada Arara Azul',
    subjectError: 'Achtung: Zahlungsfehler – Pousada Arara Azul',
    confirmedTitle: 'Buchung Bestätigt',
    confirmedSubtitle: 'Ein exklusives Erlebnis erwartet Sie',
    hello: 'Hallo',
    confirmedIntro: 'Ihre Buchung wurde erfolgreich bestätigt. Wir bereiten jedes Detail Ihres Aufenthalts vor.',
    daysLeft: 'Noch',
    daysToArrival: 'Tage bis zu Ihrer Ankunft 🌿',
    code: 'Code', bungalow: 'Bungalow', checkin: 'Check-in', checkout: 'Check-out', total: 'Gesamtbetrag',
    addCalendar: 'Zu Google Kalender hinzufügen',
    upgradeTitle: 'Exklusives Upgrade',
    upgradeText: 'Möchten Sie Ihr Erlebnis aufwerten? Wir bieten Bungalow-Upgrades mit besonderer Aussicht und speziellen Annehmlichkeiten.',
    upgradeBtn: 'Verfügbares Upgrade ansehen',
    tourTitle: 'Amazonas-Erlebnis',
    tourText: 'Exklusive Waldtouren, nächtliche Kaimanbeobachtung und Besuche bei lokalen Gemeinschaften. Begrenzte Plätze.',
    tourBtn: 'Tour Buchen',
    cancelTitle: '📋 Stornierungsbedingungen',
    cancelText: 'Stornierung bis 30 Tage: teilweise Rückerstattung gemäß Richtlinie. Weniger als 7 Tage vor Check-in oder No-Show: keine Rückerstattung.',
    cancelLink: 'Vollständige Richtlinie ansehen (PDF)',
    contactTeam: 'Unser Team kontaktieren',
    thanks: 'Vielen Dank für Ihr Vertrauen.',
    team: 'Pousada Arara Azul Team',
    paidTitle: 'Zahlung Genehmigt ✓',
    paidIntro: 'Ihre Zahlung wurde erfolgreich verarbeitet! Sie erhalten in Kürze Ihre Buchungsbestätigung per E-Mail mit allen Details.',
    paymentDetails: '💳 Zahlungsdetails',
    method: 'Methode', amount: 'Betrag', txId: 'Transaktions-ID', date: 'Datum',
    paid: 'Zahlung Genehmigt',
    methodPix: 'PIX', methodCard: 'Kreditkarte',
    helpQuestions: 'Fragen?',
    errorTitle: 'Achtung: Zahlungsfehler',
    errorIntro: 'Leider gab es ein Problem bei der Verarbeitung Ihrer Zahlung. Keine Sorge, es wurde kein Betrag abgebucht.',
    errorReason: '⚠️ Fehlergrund',
    errorUnknown: 'Unbekannter Fehler bei der Zahlungsverarbeitung',
    notProcessed: '✗ Zahlung Nicht Verarbeitet',
    whatToDo: 'Was tun?',
    todo1: 'Überprüfen Sie die Kartendaten und versuchen Sie es erneut',
    todo2: 'Versuchen Sie eine andere Zahlungsmethode (PIX oder eine andere Karte)',
    todo3: 'Kontaktieren Sie uns für Unterstützung',
    needHelp: 'Brauchen Sie Hilfe? Wir sind für Sie da:',
    rights: 'Alle Rechte vorbehalten',
    waUpgrade: (c: string) => `Hallo! Ich habe die Buchung ${c} und möchte mich über ein Bungalow-Upgrade informieren.`,
    waTour: (c: string) => `Hallo! Ich habe die Buchung ${c} und möchte Touren buchen, um mein Amazonas-Erlebnis zu ergänzen.`,
    waTeam: (c: string) => `Hallo! Ich habe die Buchung ${c} und hätte gerne weitere Informationen.`,
  },
} as const;

// Paleta de cores premium
const COLORS = {
  azulPetroleo: '#0E3A3A',
  verdeAmazonia: '#1F7A63',
  offWhite: '#F6F9F8',
  textoSecundario: '#4a5568',
  textoMuted: '#718096',
  borderLight: '#e2e8f0',
  warningBg: '#FEF3C7',
  warningText: '#92400E',
  successGreen: '#22c55e',
  errorRed: '#ef4444',
};

const formatCurrency = (value: number, lang: Lang = 'pt') => {
  return new Intl.NumberFormat(CURRENCY_LOCALE[lang], {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateStr: string, lang: Lang = 'pt') => {
  return new Date(dateStr).toLocaleDateString(LOCALE_MAP[lang], {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const formatDateShort = (dateStr: string, lang: Lang = 'pt') => {
  return new Date(dateStr).toLocaleDateString(LOCALE_MAP[lang], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatReservationNumber = (id: string): string => {
  if (!id) return 'N/A';
  const numbers = id.replace(/[^0-9]/g, '');
  const suffix = numbers.slice(-6).padStart(6, '0');
  return `PAA-${suffix}`;
};

const getCurrentYear = () => new Date().getFullYear();

// Helper para gerar link do Google Calendar
const buildGoogleCalendarLink = (checkIn: string, checkOut: string, codigo: string) => {
  const formatGCalDate = (dateStr: string, time: string) => {
    const d = new Date(dateStr);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}T${time}`;
  };
  const start = formatGCalDate(checkIn, '140000');
  const end = formatGCalDate(checkOut, '120000');
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=Reserva+Pousada+Arara+Azul&dates=${start}/${end}&details=Reserva+confirmada+Codigo+${encodeURIComponent(codigo)}&location=Manacapuru,+AM`;
};

// ============================================
// TEMPLATE PREMIUM: RESERVA CONFIRMADA
// ============================================
const getReservationConfirmedEmailPremium = (data: {
  codigo_reserva: string;
  nome_cliente: string;
  tipo_quarto: string;
  checkin: string;
  checkout: string;
  valor_total: string;
  dias_para_checkin: number;
  google_calendar_link: string;
  link_upgrade: string;
  link_passeio: string;
  link_equipe: string;
  lang: Lang;
}) => { const T = I18N[data.lang]; return `<!DOCTYPE html>
<html lang="${LOCALE_MAP[data.lang]}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${T.confirmedTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${T.daysLeft} ${data.dias_para_checkin} ${T.daysToArrival}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:50px 20px;">
<table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.08);">
<tr><td align="center" style="padding:50px 30px;background:linear-gradient(135deg,#0B3A66 0%,#0F6B4D 100%);color:#ffffff;">
<img src="https://resend-attachments.s3.amazonaws.com/d5lMO5xYixu678E" width="130" style="display:block;margin-bottom:20px;" alt="Pousada Arara Azul">
<h1 style="margin:0;font-size:26px;font-weight:600;">${T.confirmedTitle}</h1>
<p style="margin:12px 0 0;font-size:14px;opacity:0.9;">${T.confirmedSubtitle}</p>
</td></tr>
<tr><td style="padding:45px 40px;color:#2D3748;font-size:15px;line-height:1.7;">
<p style="margin:0 0 20px;font-size:18px;color:#0B3A66;">${T.hello} <strong>${data.nome_cliente}</strong>,</p>
<p style="margin:0 0 30px;">${T.confirmedIntro}</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0B3A66;border-radius:16px;margin-bottom:35px;"><tr><td align="center" style="color:#ffffff;padding:30px;">
<p style="margin:0;font-size:14px;opacity:0.8;">${T.daysLeft}</p>
<p style="margin:8px 0;font-size:42px;font-weight:700;">${data.dias_para_checkin}</p>
<p style="margin:0;font-size:14px;opacity:0.8;">${T.daysToArrival}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6FBF9;border-radius:14px;border:1px solid #E4EFEA;"><tr><td style="padding:28px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:8px 0;color:#6B7280;">${T.code}</td><td align="right"><strong>${data.codigo_reserva}</strong></td></tr>
<tr><td style="padding:8px 0;color:#6B7280;">${T.bungalow}</td><td align="right"><strong>${data.tipo_quarto}</strong></td></tr>
<tr><td style="padding:8px 0;color:#6B7280;">${T.checkin}</td><td align="right"><strong>${data.checkin}</strong></td></tr>
<tr><td style="padding:8px 0;color:#6B7280;">${T.checkout}</td><td align="right"><strong>${data.checkout}</strong></td></tr>
<tr><td style="padding-top:16px;font-size:17px;color:#0B3A66;"><strong>${T.total}</strong></td><td align="right" style="padding-top:16px;font-size:17px;"><strong>${data.valor_total}</strong></td></tr>
</table></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;"><tr><td align="center">
<a href="${data.google_calendar_link}" style="background:#0B3A66;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">${T.addCalendar}</a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:45px;background:#FFF8ED;border-radius:14px;border:1px solid #F2E3C7;"><tr><td style="padding:28px;">
<h3 style="margin:0 0 12px;color:#7A4A00;">${T.upgradeTitle}</h3>
<p style="margin:0 0 20px;">${T.upgradeText}</p>
<a href="${data.link_upgrade}" style="background:#C27C2C;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">${T.upgradeBtn}</a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;background:#EDF6F3;border-radius:14px;border:1px solid #DDEBE5;"><tr><td style="padding:28px;">
<h3 style="margin:0 0 12px;color:#0B3A66;">${T.tourTitle}</h3>
<p style="margin:0 0 20px;">${T.tourText}</p>
<a href="${data.link_passeio}" style="background:#1E8F5A;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">${T.tourBtn}</a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:35px;background:#FFF9F0;border-radius:12px;border:1px solid #F0E4D0;"><tr><td style="padding:22px 28px;">
<h3 style="margin:0 0 10px;color:#7A4A00;font-size:14px;font-weight:700;">${T.cancelTitle}</h3>
<p style="margin:0 0 12px;font-size:13px;color:#5C4A2A;line-height:1.6;">${T.cancelText}</p>
<a href="https://pousadararazul.com/docs/politica-cancelamento.pdf" style="color:#7A4A00;font-size:13px;font-weight:600;text-decoration:underline;">${T.cancelLink}</a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;"><tr><td align="center">
<a href="${data.link_equipe}" style="color:#1E8F5A;font-weight:600;text-decoration:none;">${T.contactTeam}</a>
</td></tr></table>
<p style="margin:40px 0 0;">${T.thanks}<br><strong>${T.team}</strong></p>
</td></tr>
<tr><td align="center" style="padding:25px;background:#0B3A66;color:rgba(255,255,255,0.8);font-size:12px;">
© ${getCurrentYear()} Pousada Arara Azul — Manacapuru, AM
</td></tr>
</table></td></tr></table>
</body></html>`; };

// ============================================
// TEMPLATE PREMIUM: PAGAMENTO APROVADO
// ============================================
const getPaymentSuccessEmailPremium = (data: {
  nome_cliente: string;
  metodo_pagamento: string;
  valor: string;
  payment_id: string;
  data_pagamento: string;
  lang: Lang;
}) => { const T = I18N[data.lang]; return `
<!DOCTYPE html>
<html lang="${LOCALE_MAP[data.lang]}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${T.paidTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.offWhite}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite};">
    <tr><td align="center" style="padding: 40px 20px;">
      <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr><td align="center" style="background: linear-gradient(135deg, ${COLORS.azulPetroleo} 0%, ${COLORS.verdeAmazonia} 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
          <img src="${LOGO_URL}" alt="Pousada Arara Azul" width="80" style="display: block; border: 0; border-radius: 50%;" />
          <h1 style="color: #ffffff; font-size: 24px; margin: 15px 0 5px 0; font-weight: 600;">${T.paidTitle}</h1>
        </td></tr>
        <tr><td style="padding: 40px;">
          <p style="color: ${COLORS.azulPetroleo}; font-size: 18px; margin: 0 0 20px 0;">${T.hello} <strong>${data.nome_cliente}</strong>,</p>
          <p style="color: ${COLORS.textoSecundario}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">${T.paidIntro}</p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite}; border-radius: 8px; border-left: 4px solid ${COLORS.successGreen};"><tr><td style="padding: 24px;">
            <h2 style="color: ${COLORS.azulPetroleo}; font-size: 16px; margin: 0 0 16px 0;">${T.paymentDetails}</h2>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};"><span style="color: ${COLORS.textoMuted}; font-size: 14px;">${T.method}</span></td>
                  <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};"><strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.metodo_pagamento === 'pix' ? T.methodPix : T.methodCard}</strong></td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};"><span style="color: ${COLORS.textoMuted}; font-size: 14px;">${T.amount}</span></td>
                  <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};"><strong style="color: ${COLORS.verdeAmazonia}; font-size: 16px;">${data.valor}</strong></td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};"><span style="color: ${COLORS.textoMuted}; font-size: 14px;">${T.txId}</span></td>
                  <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};"><strong style="color: ${COLORS.azulPetroleo}; font-size: 12px;">${data.payment_id}</strong></td></tr>
              <tr><td style="padding: 8px 0;"><span style="color: ${COLORS.textoMuted}; font-size: 14px;">${T.date}</span></td>
                  <td align="right" style="padding: 8px 0;"><strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.data_pagamento}</strong></td></tr>
            </table>
          </td></tr></table>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;"><tr><td align="center">
            <span style="display: inline-block; background-color: ${COLORS.successGreen}; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">✓ ${T.paid}</span>
          </td></tr></table>
          <p style="color: ${COLORS.textoSecundario}; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">${T.helpQuestions}</p>
          <p style="color: ${COLORS.textoSecundario}; font-size: 14px; margin: 10px 0;">📱 <a href="https://wa.me/559284829983" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">WhatsApp: (92) 98482-9983</a></p>
        </td></tr>
        <tr><td align="center" style="background-color: ${COLORS.azulPetroleo}; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">© ${getCurrentYear()} Pousada Arara Azul - ${T.rights}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`; };

// ============================================
// TEMPLATE PREMIUM: ERRO NO PAGAMENTO
// ============================================
const getPaymentErrorEmailPremium = (data: {
  nome_cliente: string;
  erro: string;
  lang: Lang;
}) => { const T = I18N[data.lang]; return `
<!DOCTYPE html>
<html lang="${LOCALE_MAP[data.lang]}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${T.errorTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.offWhite}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite};">
    <tr><td align="center" style="padding: 40px 20px;">
      <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr><td align="center" style="background: linear-gradient(135deg, ${COLORS.azulPetroleo} 0%, #5a5a5a 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
          <img src="${LOGO_URL}" alt="Pousada Arara Azul" width="80" style="display: block; border: 0; border-radius: 50%;" />
          <h1 style="color: #ffffff; font-size: 24px; margin: 15px 0 5px 0; font-weight: 600;">${T.errorTitle}</h1>
        </td></tr>
        <tr><td style="padding: 40px;">
          <p style="color: ${COLORS.azulPetroleo}; font-size: 18px; margin: 0 0 20px 0;">${T.hello} <strong>${data.nome_cliente}</strong>,</p>
          <p style="color: ${COLORS.textoSecundario}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">${T.errorIntro}</p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid ${COLORS.errorRed};"><tr><td style="padding: 24px;">
            <h2 style="color: #991B1B; font-size: 16px; margin: 0 0 10px 0;">${T.errorReason}</h2>
            <p style="color: #7F1D1D; font-size: 14px; margin: 0;">${data.erro || T.errorUnknown}</p>
          </td></tr></table>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;"><tr><td align="center">
            <span style="display: inline-block; background-color: ${COLORS.errorRed}; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">${T.notProcessed}</span>
          </td></tr></table>
          <p style="color: ${COLORS.textoSecundario}; font-size: 15px; line-height: 1.6; margin: 30px 0 0 0;"><strong>${T.whatToDo}</strong></p>
          <ul style="color: ${COLORS.textoSecundario}; font-size: 14px; line-height: 1.8; padding-left: 20px;">
            <li>${T.todo1}</li><li>${T.todo2}</li><li>${T.todo3}</li>
          </ul>
          <p style="color: ${COLORS.textoSecundario}; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">${T.needHelp}</p>
          <p style="color: ${COLORS.textoSecundario}; font-size: 14px; margin: 10px 0;">
            📱 <a href="https://wa.me/559284829983" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">WhatsApp: (92) 98482-9983</a><br/>
            📧 <a href="mailto:reservas@pousadararazul.com" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">reservas@pousadararazul.com</a>
          </p>
        </td></tr>
        <tr><td align="center" style="background-color: ${COLORS.azulPetroleo}; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">© ${getCurrentYear()} Pousada Arara Azul - ${T.rights}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`; };

// Função para enviar email via Resend
async function sendEmailViaResend(to: string, subject: string, html: string) {
  console.log(`Enviando email para: ${to}, subject: ${subject}`);
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Pousada Arara Azul <reservas@pousadararazul.com>",
      to: [to],
      subject,
      html,
    }),
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    console.error('Erro Resend:', responseData);
    throw new Error(responseData.message || "Failed to send email");
  }
  
  console.log('Email enviado com sucesso:', responseData);
  return responseData;
}

// Handler principal
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { type, reservationId, email, name, force, errorMessage, paymentDetails, lang: bodyLang }: EmailRequest = await req.json();
    
    console.log('=== SEND-RESERVATION-EMAIL ===');
    console.log('Tipo:', type);
    console.log('ReservationId:', reservationId);
    console.log('Email:', email);
    console.log('Nome:', name);

    // Determine language: explicit body lang > reservation.guest_language > 'pt'
    let lang: Lang = normalizeLang(bodyLang);

    // ========================================
    // PROTEÇÃO CONTRA DUPLICADOS (IDEMPOTÊNCIA)
    // ========================================
    if (reservationId && !force) {
      const { data: existingEmail } = await supabase
        .from('email_logs')
        .select('id, sent_at')
        .eq('reservation_id', reservationId)
        .eq('email_type', type)
        .eq('status', 'sent')
        .maybeSingle();

      if (existingEmail) {
        console.log(`Email tipo "${type}" já enviado para reserva ${reservationId} em ${existingEmail.sent_at}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            skipped: true, 
            message: 'Email já foi enviado anteriormente',
            sent_at: existingEmail.sent_at 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // If reservationId is given and no explicit lang, fetch from reservation
    let reservation: any = null;
    if (reservationId) {
      const { data } = await supabase
        .from('reservations')
        .select('*, packages:package_id (name)')
        .eq('id', reservationId)
        .maybeSingle();
      reservation = data;
      if (!bodyLang && reservation?.guest_language) {
        lang = normalizeLang(reservation.guest_language);
      }
    }

    const T = I18N[lang];
    const dataPagamento = formatDateShort(new Date().toISOString(), lang);
    let subject = '';
    let html = '';

    if (type === 'payment_success') {
      subject = T.subjectPaid;
      html = getPaymentSuccessEmailPremium({
        nome_cliente: name,
        metodo_pagamento: paymentDetails?.method || 'credit_card',
        valor: formatCurrency(paymentDetails?.amount || 0, lang),
        payment_id: paymentDetails?.paymentId || 'N/A',
        data_pagamento: dataPagamento,
        lang,
      });
      
    } else if (type === 'payment_error') {
      subject = T.subjectError;
      html = getPaymentErrorEmailPremium({
        nome_cliente: name,
        erro: errorMessage || T.errorUnknown,
        lang,
      });
      
    } else if (type === 'reservation_confirmed') {
      if (!reservation) {
        throw new Error('Reserva não encontrada');
      }

      const checkInDate = new Date(reservation.check_in);
      const now = new Date();
      const daysToCheckin = Math.max(0, Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const codigoReserva = formatReservationNumber(reservation.id);
      const googleCalLink = buildGoogleCalendarLink(reservation.check_in, reservation.check_out, codigoReserva);
      
      const whatsappBase = 'https://wa.me/5592984125475';
      const linkUpgrade = `${whatsappBase}?text=${encodeURIComponent(T.waUpgrade(codigoReserva))}`;
      const linkPasseio = `${whatsappBase}?text=${encodeURIComponent(T.waTour(codigoReserva))}`;
      const linkEquipe = `${whatsappBase}?text=${encodeURIComponent(T.waTeam(codigoReserva))}`;

      subject = T.subjectConfirmed;
      html = getReservationConfirmedEmailPremium({
        codigo_reserva: codigoReserva,
        nome_cliente: reservation.guest_name,
        tipo_quarto: reservation.room_name || T.bungalow,
        checkin: formatDate(reservation.check_in, lang),
        checkout: formatDate(reservation.check_out, lang),
        valor_total: formatCurrency(reservation.total_price, lang),
        dias_para_checkin: daysToCheckin,
        google_calendar_link: googleCalLink,
        link_upgrade: linkUpgrade,
        link_passeio: linkPasseio,
        link_equipe: linkEquipe,
        lang,
      });
    }

    // ========================================
    // ENVIAR EMAIL VIA RESEND
    // ========================================
    const emailResponse = await sendEmailViaResend(email, subject, html);

    // ========================================
    // REGISTRAR LOG DE ENVIO
    // ========================================
    const { error: logError } = await supabase.from('email_logs').insert({
      reservation_id: reservationId || null,
      recipient_email: email,
      email_type: type,
      subject: subject,
      status: 'sent',
      resend_id: emailResponse.id,
      sent_at: new Date().toISOString(),
      metadata: {
        resend_response: emailResponse,
        payment_details: paymentDetails,
      }
    });

    if (logError) {
      console.error('Erro ao registrar log de email:', logError);
    }

    console.log('Email enviado e logado com sucesso');

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error: any) {
    console.error("Erro ao enviar email:", error);
    
    // Registrar falha no log
    try {
      const body = await req.clone().json();
      await supabase.from('email_logs').insert({
        reservation_id: body.reservationId || null,
        recipient_email: body.email || 'unknown',
        email_type: body.type || 'unknown',
        subject: 'FAILED',
        status: 'failed',
        error_message: error.message,
        metadata: { error_stack: error.stack }
      });
    } catch (logErr) {
      console.error('Erro ao registrar falha:', logErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
