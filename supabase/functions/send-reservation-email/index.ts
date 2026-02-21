import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOGO_URL = "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/logo-arara-azul.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'payment_success' | 'payment_error' | 'reservation_confirmed';
  reservationId: string;
  email: string;
  name: string;
  force?: boolean;
  errorMessage?: string;
  paymentDetails?: {
    method: string;
    amount: number;
    status: string;
    paymentId?: string;
  };
}

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const formatDateShort = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
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

// ============================================
// TEMPLATE PREMIUM: RESERVA CONFIRMADA
// ============================================
const formatPaymentMethod = (method: string): string => {
  const map: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    boleto: 'Boleto',
  };
  return map[method] || method || 'Não informado';
};

const formatPaymentStatus = (status: string): string => {
  const map: Record<string, string> = {
    paid: 'Aprovado',
    pending: 'Pendente',
    failed: 'Falhou',
    refunded: 'Reembolsado',
  };
  return map[status] || status || 'Pendente';
};

const getReservationConfirmedEmailPremium = (data: {
  codigo_reserva: string;
  nome_cliente: string;
  tipo_quarto: string;
  checkin: string;
  checkout: string;
  numero_noites: number;
  valor_total: string;
  forma_pagamento: string;
  status_pagamento: string;
}) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="x-apple-disable-message-reformatting" />
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
<title>Reserva Confirmada</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
<!-- PREHEADER -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
Sua reserva na Pousada Arara Azul foi confirmada com sucesso 🌿
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td align="center" style="padding:40px 15px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
<!-- HEADER -->
<tr>
<td align="center" style="padding:36px 24px;background:linear-gradient(135deg,#0B3A66 0%, #0F6B4D 100%);">
<img src="https://resend-attachments.s3.amazonaws.com/d5lMO5xYixu678E"
width="120"
style="display:block;margin-bottom:16px;border:none;"
alt="Pousada Arara Azul Logo"/>
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">
Reserva Confirmada
</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">
Natureza, conforto e experiências autênticas na Amazônia
</p>
</td>
</tr>
<!-- BODY -->
<tr>
<td style="padding:36px;color:#2D3748;font-size:15px;line-height:1.6;">
<p style="margin:0 0 20px;font-size:18px;color:#0B3A66;">
Olá <strong>${data.nome_cliente}</strong>,
</p>
<p style="margin:0 0 28px;">
Sua reserva foi confirmada com sucesso. Confira os detalhes abaixo:
</p>
<!-- RESERVA BOX -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="background:#F4F9F6;border-radius:10px;border-left:5px solid #1E8F5A;padding:20px;">
<tr>
<td style="padding:20px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:6px 0;">Código</td>
<td align="right"><strong>${data.codigo_reserva}</strong></td>
</tr>
<tr>
<td style="padding:6px 0;">Bangalô</td>
<td align="right"><strong>${data.tipo_quarto}</strong></td>
</tr>
<tr>
<td style="padding:6px 0;">Check-in</td>
<td align="right"><strong>${data.checkin}</strong></td>
</tr>
<tr>
<td style="padding:6px 0;">Check-out</td>
<td align="right"><strong>${data.checkout}</strong></td>
</tr>
<tr>
<td style="padding:6px 0;">Noites</td>
<td align="right"><strong>${data.numero_noites}</strong></td>
</tr>
<tr>
<td style="padding:6px 0;">Forma de pagamento</td>
<td align="right"><strong>${data.forma_pagamento}</strong></td>
</tr>
<tr>
<td style="padding:6px 0;">Status do pagamento</td>
<td align="right"><strong>${data.status_pagamento}</strong></td>
</tr>
<tr>
<td style="padding:10px 0;font-size:16px;color:#0B3A66;">
<strong>Valor total</strong>
</td>
<td align="right" style="font-size:16px;">
<strong>${data.valor_total}</strong>
</td>
</tr>
</table>
</td>
</tr>
</table>
<!-- HORÁRIOS -->
<p style="margin:28px 0 10px;font-weight:bold;color:#0B3A66;">
Informações Importantes
</p>
<p style="margin:0 0 5px;">🕑 Check-in a partir das 14h</p>
<p style="margin:0 0 5px;">🕛 Check-out até 12h</p>
<p style="margin:0 0 20px;">📍 Manacapuru - AM</p>
<!-- CTA PRINCIPAL -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
<tr>
<td align="center">
<a href="https://pousadararazul.com"
style="background:#1E8F5A;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
VER MINHA RESERVA
</a>
</td>
</tr>
</table>
<!-- WHATSAPP -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<a href="https://wa.me/5592984125475"
style="color:#1E8F5A;text-decoration:none;font-weight:bold;">
Falar com a equipe no WhatsApp
</a>
</td>
</tr>
</table>
<p style="margin:32px 0 0;">
Até breve,<br/>
<strong>Equipe Pousada Arara Azul</strong>
</p>
</td>
</tr>
<!-- FOOTER -->
<tr>
<td align="center"
style="padding:20px;background:#0B3A66;color:rgba(255,255,255,0.8);font-size:12px;">
© ${getCurrentYear()} Pousada Arara Azul — Manacapuru, AM
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
`;

// ============================================
// TEMPLATE PREMIUM: PAGAMENTO APROVADO
// ============================================
const getPaymentSuccessEmailPremium = (data: {
  nome_cliente: string;
  metodo_pagamento: string;
  valor: string;
  payment_id: string;
  data_pagamento: string;
}) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pagamento Aprovado - Pousada Arara Azul</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.offWhite}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, ${COLORS.azulPetroleo} 0%, ${COLORS.verdeAmazonia} 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <img src="${LOGO_URL}" alt="Pousada Arara Azul" width="80" style="display: block; border: 0; border-radius: 50%;" />
              <h1 style="color: #ffffff; font-size: 24px; margin: 15px 0 5px 0; font-weight: 600;">
                Pagamento Aprovado ✓
              </h1>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="color: ${COLORS.azulPetroleo}; font-size: 18px; margin: 0 0 20px 0;">
                Olá <strong>${data.nome_cliente}</strong>,
              </p>
              
              <p style="color: ${COLORS.textoSecundario}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Seu pagamento foi processado com sucesso! Em breve você receberá o email de confirmação 
                da sua reserva com todos os detalhes.
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite}; border-radius: 8px; border-left: 4px solid ${COLORS.successGreen};">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="color: ${COLORS.azulPetroleo}; font-size: 16px; margin: 0 0 16px 0;">
                      💳 Detalhes do Pagamento
                    </h2>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Método</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.metodo_pagamento === 'pix' ? 'PIX' : 'Cartão de Crédito'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Valor</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.verdeAmazonia}; font-size: 16px;">${data.valor}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">ID da Transação</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 12px;">${data.payment_id}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Data</span>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.data_pagamento}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: ${COLORS.successGreen}; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      ✓ Pagamento Aprovado
                    </span>
                  </td>
                </tr>
              </table>

              <p style="color: ${COLORS.textoSecundario}; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Em caso de dúvidas:
              </p>
              <p style="color: ${COLORS.textoSecundario}; font-size: 14px; margin: 10px 0;">
                📱 <a href="https://wa.me/559284829983" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">WhatsApp: (92) 98482-9983</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: ${COLORS.azulPetroleo}; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
                © ${getCurrentYear()} Pousada Arara Azul - Todos os direitos reservados
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
`;

// ============================================
// TEMPLATE PREMIUM: ERRO NO PAGAMENTO
// ============================================
const getPaymentErrorEmailPremium = (data: {
  nome_cliente: string;
  erro: string;
}) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Erro no Pagamento - Pousada Arara Azul</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.offWhite}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, ${COLORS.azulPetroleo} 0%, #5a5a5a 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <img src="${LOGO_URL}" alt="Pousada Arara Azul" width="80" style="display: block; border: 0; border-radius: 50%;" />
              <h1 style="color: #ffffff; font-size: 24px; margin: 15px 0 5px 0; font-weight: 600;">
                Atenção: Erro no Pagamento
              </h1>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="color: ${COLORS.azulPetroleo}; font-size: 18px; margin: 0 0 20px 0;">
                Olá <strong>${data.nome_cliente}</strong>,
              </p>
              
              <p style="color: ${COLORS.textoSecundario}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Infelizmente ocorreu um problema ao processar seu pagamento. 
                Não se preocupe, nenhum valor foi cobrado.
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid ${COLORS.errorRed};">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="color: #991B1B; font-size: 16px; margin: 0 0 10px 0;">
                      ⚠️ Motivo do Erro
                    </h2>
                    <p style="color: #7F1D1D; font-size: 14px; margin: 0;">
                      ${data.erro || 'Erro desconhecido no processamento do pagamento'}
                    </p>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: ${COLORS.errorRed}; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      ✗ Pagamento Não Processado
                    </span>
                  </td>
                </tr>
              </table>

              <p style="color: ${COLORS.textoSecundario}; font-size: 15px; line-height: 1.6; margin: 30px 0 0 0;">
                <strong>O que fazer?</strong>
              </p>
              <ul style="color: ${COLORS.textoSecundario}; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                <li>Verifique os dados do cartão e tente novamente</li>
                <li>Tente usar outro método de pagamento (PIX ou outro cartão)</li>
                <li>Entre em contato conosco para assistência</li>
              </ul>

              <p style="color: ${COLORS.textoSecundario}; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Precisa de ajuda? Estamos aqui:
              </p>
              <p style="color: ${COLORS.textoSecundario}; font-size: 14px; margin: 10px 0;">
                📱 <a href="https://wa.me/559284829983" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">WhatsApp: (92) 98482-9983</a><br/>
                📧 <a href="mailto:reservas@pousadararazul.com" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">reservas@pousadararazul.com</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: ${COLORS.azulPetroleo}; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
                © ${getCurrentYear()} Pousada Arara Azul - Todos os direitos reservados
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
`;

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
    const { type, reservationId, email, name, force, errorMessage, paymentDetails }: EmailRequest = await req.json();
    
    console.log('=== SEND-RESERVATION-EMAIL ===');
    console.log('Tipo:', type);
    console.log('ReservationId:', reservationId);
    console.log('Email:', email);
    console.log('Nome:', name);

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

    const dataPagamento = formatDateShort(new Date().toISOString());
    let subject = '';
    let html = '';

    // ========================================
    // GERAR TEMPLATE BASEADO NO TIPO
    // ========================================
    if (type === 'payment_success') {
      subject = '✓ Pagamento Aprovado – Pousada Arara Azul';
      html = getPaymentSuccessEmailPremium({
        nome_cliente: name,
        metodo_pagamento: paymentDetails?.method || 'credit_card',
        valor: formatCurrency(paymentDetails?.amount || 0),
        payment_id: paymentDetails?.paymentId || 'N/A',
        data_pagamento: dataPagamento,
      });
      
    } else if (type === 'payment_error') {
      subject = 'Atenção: Erro no Pagamento – Pousada Arara Azul';
      html = getPaymentErrorEmailPremium({
        nome_cliente: name,
        erro: errorMessage || 'Erro desconhecido',
      });
      
    } else if (type === 'reservation_confirmed') {
      // Buscar dados completos da reserva
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select(`
          *,
          packages:package_id (name)
        `)
        .eq('id', reservationId)
        .single();

      if (reservationError) {
        throw new Error(`Erro ao buscar reserva: ${reservationError.message}`);
      }

      const checkInDate = new Date(reservation.check_in);
      const checkOutDate = new Date(reservation.check_out);
      const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

      subject = '🌿 Reserva confirmada – Pousada Arara Azul';
      html = getReservationConfirmedEmailPremium({
        codigo_reserva: formatReservationNumber(reservation.id),
        nome_cliente: reservation.guest_name,
        tipo_quarto: reservation.room_name || 'Bangalô',
        checkin: formatDate(reservation.check_in),
        checkout: formatDate(reservation.check_out),
        numero_noites: nights,
        valor_total: formatCurrency(reservation.total_price),
        forma_pagamento: formatPaymentMethod(reservation.payment_method),
        status_pagamento: formatPaymentStatus(reservation.payment_status),
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
      // Não falhar o request por causa do log
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
