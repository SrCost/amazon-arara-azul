import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Simple function to send email via Resend API
async function sendEmailViaResend(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Pousada Arara Azul <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }
  
  return response.json();
}

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getPaymentSuccessEmail = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5016; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .success-badge { background: #22c55e; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; }
    .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦜 Pousada Arara Azul</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.name}</strong>,</p>
      <p style="text-align: center;"><span class="success-badge">✓ Pagamento Confirmado</span></p>
      <p>Seu pagamento foi processado com sucesso!</p>
      
      <div class="details">
        <h3>Detalhes do Pagamento</h3>
        <div class="details-row"><span>Método:</span><strong>${data.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</strong></div>
        <div class="details-row"><span>Valor:</span><strong>${formatCurrency(data.amount)}</strong></div>
        <div class="details-row"><span>ID do Pagamento:</span><strong>${data.paymentId}</strong></div>
        <div class="details-row"><span>Status:</span><strong>Aprovado</strong></div>
      </div>
      
      <p>Você receberá em breve um email com os detalhes completos da sua reserva.</p>
      <p>Em caso de dúvidas, entre em contato conosco pelo WhatsApp: <a href="https://wa.me/559284829983">(92) 98482-9983</a></p>
    </div>
    <div class="footer">
      <p>© 2025 Pousada Arara Azul - Todos os direitos reservados</p>
      <p>Manacapuru, Amazônia - AM</p>
    </div>
  </div>
</body>
</html>
`;

const getPaymentErrorEmail = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5016; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .error-badge { background: #ef4444; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; }
    .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦜 Pousada Arara Azul</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.name}</strong>,</p>
      <p style="text-align: center;"><span class="error-badge">✗ Erro no Pagamento</span></p>
      <p>Infelizmente ocorreu um problema ao processar seu pagamento.</p>
      
      <div class="details">
        <h3>Detalhes do Erro</h3>
        <p><strong>Motivo:</strong> ${data.errorMessage || 'Erro desconhecido'}</p>
      </div>
      
      <p>Por favor, tente novamente ou entre em contato conosco para assistência:</p>
      <ul>
        <li>WhatsApp: <a href="https://wa.me/559284829983">(92) 98482-9983</a></li>
        <li>Email: contato@pousadararazul.com.br</li>
      </ul>
    </div>
    <div class="footer">
      <p>© 2025 Pousada Arara Azul - Todos os direitos reservados</p>
      <p>Manacapuru, Amazônia - AM</p>
    </div>
  </div>
</body>
</html>
`;

const getReservationConfirmedEmail = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5016; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .success-badge { background: #22c55e; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; }
    .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .highlight { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦜 Pousada Arara Azul</h1>
      <p>Experiências Autênticas na Amazônia</p>
    </div>
    <div class="content">
      <p>Olá <strong>${data.guestName}</strong>,</p>
      <p style="text-align: center;"><span class="success-badge">✓ Reserva Confirmada</span></p>
      <p>Sua reserva foi confirmada com sucesso! Estamos ansiosos para recebê-lo na Pousada Arara Azul.</p>
      
      <div class="details">
        <h3>📋 Detalhes da Reserva</h3>
        <div class="details-row"><span>Código da Reserva:</span><strong>${data.reservationId}</strong></div>
        <div class="details-row"><span>Bangalô:</span><strong>${data.roomName}</strong></div>
        ${data.packageName ? `<div class="details-row"><span>Pacote:</span><strong>${data.packageName}</strong></div>` : ''}
        <div class="details-row"><span>Check-in:</span><strong>${formatDate(data.checkIn)}</strong></div>
        <div class="details-row"><span>Check-out:</span><strong>${formatDate(data.checkOut)}</strong></div>
        <div class="details-row"><span>Hóspedes:</span><strong>${data.guests}</strong></div>
        <div class="details-row"><span>Valor Total:</span><strong>${formatCurrency(data.totalPrice)}</strong></div>
      </div>
      
      <div class="details">
        <h3>💳 Pagamento</h3>
        <div class="details-row"><span>Método:</span><strong>${data.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</strong></div>
        <div class="details-row"><span>Status:</span><strong style="color: #22c55e;">Aprovado</strong></div>
        <div class="details-row"><span>ID:</span><strong>${data.paymentId}</strong></div>
      </div>

      <div class="highlight">
        <h4>📍 Como Chegar</h4>
        <p>A Pousada Arara Azul está localizada em Manacapuru, Amazônia - AM.</p>
        <p>Oferecemos transfer de ida e volta do aeroporto de Manaus (incluído nos pacotes).</p>
      </div>

      ${data.specialRequests ? `
      <div class="details">
        <h3>📝 Observações Especiais</h3>
        <p>${data.specialRequests}</p>
      </div>
      ` : ''}
      
      <p>Em caso de dúvidas ou necessidade de alterações, entre em contato:</p>
      <ul>
        <li>WhatsApp: <a href="https://wa.me/559284829983">(92) 98482-9983</a></li>
        <li>Instagram: <a href="https://instagram.com/pousadararazul">@pousadararazul</a></li>
      </ul>
      
      <p>Até breve!</p>
      <p><strong>Equipe Pousada Arara Azul</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Pousada Arara Azul - Todos os direitos reservados</p>
      <p>Manacapuru, Amazônia - AM</p>
      <p style="font-size: 10px; color: #999;">Este é um comprovante oficial da sua reserva. Guarde este email.</p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, reservationId, email, name, errorMessage, paymentDetails }: EmailRequest = await req.json();
    
    console.log('Email request:', { type, reservationId, email, name });

    let subject = '';
    let html = '';

    if (type === 'payment_success') {
      subject = '✓ Pagamento Confirmado - Pousada Arara Azul';
      html = getPaymentSuccessEmail({
        name,
        paymentMethod: paymentDetails?.method,
        amount: paymentDetails?.amount,
        paymentId: paymentDetails?.paymentId,
      });
    } else if (type === 'payment_error') {
      subject = '✗ Erro no Pagamento - Pousada Arara Azul';
      html = getPaymentErrorEmail({
        name,
        errorMessage,
      });
    } else if (type === 'reservation_confirmed') {
      // Fetch full reservation details
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

      subject = '🦜 Reserva Confirmada - Pousada Arara Azul';
      html = getReservationConfirmedEmail({
        reservationId: reservation.id,
        guestName: reservation.guest_name,
        roomName: reservation.room_name,
        packageName: reservation.packages?.name,
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        guests: reservation.guests,
        totalPrice: reservation.total_price,
        paymentMethod: reservation.payment_method,
        paymentId: reservation.payment_intent_id,
        specialRequests: reservation.special_requests,
      });
    }

    const emailResponse = await sendEmailViaResend(email, subject, html);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
