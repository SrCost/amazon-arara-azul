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
const getReservationConfirmedEmailPremium = (data: {
  codigo_reserva: string;
  nome_cliente: string;
  tipo_quarto: string;
  pacote?: string;
  checkin: string;
  checkout: string;
  hospedes: number;
  valor_total: string;
  metodo_pagamento: string;
  observacoes?: string;
  data_pagamento: string;
}) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reserva Confirmada - Pousada Arara Azul</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.offWhite}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header com Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, ${COLORS.azulPetroleo} 0%, ${COLORS.verdeAmazonia} 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <img src="${LOGO_URL}" alt="Pousada Arara Azul" width="100" style="display: block; border: 0; border-radius: 50%;" />
              <h1 style="color: #ffffff; font-size: 26px; margin: 15px 0 5px 0; font-weight: 600;">
                Reserva confirmada 🌿
              </h1>
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">
                Experiências Autênticas na Amazônia
              </p>
            </td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="color: ${COLORS.azulPetroleo}; font-size: 18px; margin: 0 0 20px 0;">
                Olá <strong>${data.nome_cliente}</strong>,
              </p>
              
              <p style="color: ${COLORS.textoSecundario}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Sua reserva foi confirmada com sucesso! Estamos muito felizes em recebê-lo(a) em nossa pousada, 
                onde a natureza amazônica se encontra com o conforto e a hospitalidade.
              </p>

              <!-- Bloco de Resumo da Reserva -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.offWhite}; border-radius: 8px; border-left: 4px solid ${COLORS.verdeAmazonia};">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="color: ${COLORS.azulPetroleo}; font-size: 16px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">
                      📋 Detalhes da Reserva
                    </h2>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Código da Reserva</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.codigo_reserva}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Bangalô</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.tipo_quarto}</strong>
                        </td>
                      </tr>
                      ${data.pacote ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Pacote</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.pacote}</strong>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Check-in</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.checkin}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Check-out</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.checkout}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <span style="color: ${COLORS.textoMuted}; font-size: 14px;">Hóspedes</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid ${COLORS.borderLight};">
                          <strong style="color: ${COLORS.azulPetroleo}; font-size: 14px;">${data.hospedes} pessoa(s)</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="color: ${COLORS.azulPetroleo}; font-size: 16px; font-weight: 600;">Valor Total</span>
                        </td>
                        <td align="right" style="padding: 12px 0;">
                          <strong style="color: ${COLORS.verdeAmazonia}; font-size: 20px;">${data.valor_total}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Badge de Status -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: ${COLORS.verdeAmazonia}; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      ✓ Pagamento Aprovado em ${data.data_pagamento}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Informações de Transfer -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; background-color: ${COLORS.warningBg}; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: ${COLORS.warningText}; font-size: 14px; margin: 0; line-height: 1.5;">
                      📍 <strong>Transfer incluído!</strong> Entraremos em contato para agendar seu transfer 
                      do aeroporto de Manaus até a pousada.
                    </p>
                  </td>
                </tr>
              </table>

              ${data.observacoes ? `
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; background-color: ${COLORS.offWhite}; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: ${COLORS.azulPetroleo}; font-size: 14px; margin: 0 0 10px 0;">📝 Observações Especiais</h3>
                    <p style="color: ${COLORS.textoSecundario}; font-size: 14px; margin: 0;">${data.observacoes}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Contato -->
              <p style="color: ${COLORS.textoSecundario}; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Em caso de dúvidas, entre em contato:
              </p>
              <p style="color: ${COLORS.textoSecundario}; font-size: 14px; margin: 10px 0;">
                📱 <a href="https://wa.me/559284829983" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">WhatsApp: (92) 98482-9983</a><br/>
                📧 <a href="mailto:reservas@pousadararazul.com" style="color: ${COLORS.verdeAmazonia}; text-decoration: none;">reservas@pousadararazul.com</a>
              </p>

              <p style="color: ${COLORS.azulPetroleo}; font-size: 16px; margin: 30px 0 0 0;">
                Até breve! 🌿<br/>
                <strong>Equipe Pousada Arara Azul</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: ${COLORS.azulPetroleo}; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
                © ${getCurrentYear()} Pousada Arara Azul - Todos os direitos reservados
              </p>
              <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 8px 0 0 0;">
                Manacapuru, Amazônia - AM | Este é um comprovante oficial da sua reserva.
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
    const { type, reservationId, email, name, errorMessage, paymentDetails }: EmailRequest = await req.json();
    
    console.log('=== SEND-RESERVATION-EMAIL ===');
    console.log('Tipo:', type);
    console.log('ReservationId:', reservationId);
    console.log('Email:', email);
    console.log('Nome:', name);

    // ========================================
    // PROTEÇÃO CONTRA DUPLICADOS (IDEMPOTÊNCIA)
    // ========================================
    if (reservationId) {
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

      subject = '🌿 Reserva confirmada – Pousada Arara Azul';
      html = getReservationConfirmedEmailPremium({
        codigo_reserva: formatReservationNumber(reservation.id),
        nome_cliente: reservation.guest_name,
        tipo_quarto: reservation.room_name || 'Bangalô',
        pacote: reservation.packages?.name,
        checkin: formatDate(reservation.check_in),
        checkout: formatDate(reservation.check_out),
        hospedes: reservation.guests,
        valor_total: formatCurrency(reservation.total_price),
        metodo_pagamento: reservation.payment_method || 'credit_card',
        observacoes: reservation.special_requests,
        data_pagamento: dataPagamento,
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
