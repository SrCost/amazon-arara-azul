import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map MP status to payments table status
function mapMpStatusToPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'approved';
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pendente';
    case 'rejected':
    case 'cancelled':
      return 'rejeitado';
    case 'refunded':
      return 'refunded';
    default:
      return 'pendente';
  }
}

// Map MP status to reservations payment_status
function mapToReservationPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'pago';
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pendente';
    case 'rejected':
    case 'cancelled':
      return 'pagamento_rejeitado';
    case 'refunded':
      return 'refunded';
    default:
      return 'pendente';
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Handle GET requests (user redirect after payment)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const paymentId = url.searchParams.get('payment_id');
      const status = url.searchParams.get('status');
      const externalReference = url.searchParams.get('external_reference');

      console.log('Mercado Pago redirect:', { paymentId, status, externalReference });

      // Redirect to confirmation page
      const baseUrl = Deno.env.get('SITE_URL') || 'https://pousada-arara-azul.lovable.app';
      const redirectUrl = new URL(`${baseUrl}/reserva-confirmada`);
      if (externalReference) {
        redirectUrl.searchParams.set('reservationId', externalReference);
      }
      redirectUrl.searchParams.set('status', status || 'pending');

      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Handle POST requests (webhook notifications from Mercado Pago)
    const body = await req.json();
    console.log('=== WEBHOOK MERCADO PAGO RECEBIDO ===');
    console.log('Body completo:', JSON.stringify(body, null, 2));

    // Only process payment notifications
    if (body.type !== 'payment') {
      console.log(`Tipo de notificação ${body.type} não processado, ignorando`);
      return new Response(JSON.stringify({ success: true, message: 'Notificação ignorada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract payment_id from body.data.id
    const paymentId = body.data?.id;

    if (!paymentId) {
      console.log('ID de pagamento ausente no webhook');
      return new Response(JSON.stringify({ success: true, message: 'ID ausente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Processando pagamento ID: ${paymentId}`);

    // Idempotency check - verify if we already processed this notification
    const { data: existingLog } = await supabase
      .from('payment_logs')
      .select('id')
      .eq('action', 'webhook_notification')
      .eq('status', body.action)
      .contains('response_payload', { data: { id: paymentId } })
      .single();

    if (existingLog) {
      console.log(`Notificação duplicada para pagamento ${paymentId}, ignorando`);
      return new Response(JSON.stringify({ success: true, message: 'Notificação já processada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fetch payment details from Mercado Pago API
    console.log(`Buscando detalhes do pagamento ${paymentId} na API do MP`);
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
        },
      }
    );

    if (!mpResponse.ok) {
      console.error(`Erro ao buscar pagamento: ${mpResponse.status} ${mpResponse.statusText}`);
      // Log the error but still return 200 to avoid MP retry
      await supabase.from('payment_logs').insert({
        action: 'webhook_error',
        status: 'error',
        error_code: mpResponse.status.toString(),
        error_message: `Failed to fetch payment details: ${mpResponse.statusText}`,
        response_payload: body
      });
      return new Response(JSON.stringify({ success: true, message: 'Erro ao buscar pagamento' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const payment = await mpResponse.json();
    console.log('=== DETALHES DO PAGAMENTO MP ===');
    console.log('ID:', payment.id);
    console.log('Status:', payment.status);
    console.log('Status Detail:', payment.status_detail);
    console.log('External Reference (reservation_id):', payment.external_reference);
    console.log('Transaction Amount:', payment.transaction_amount);
    console.log('Payer Email:', payment.payer?.email);
    console.log('Payment Method:', payment.payment_method_id);

    const reservationId = payment.external_reference;

    if (!reservationId) {
      console.log('External reference (reservation_id) não encontrado no pagamento');
      await supabase.from('payment_logs').insert({
        action: 'webhook_notification',
        status: payment.status,
        error_message: 'No external_reference found',
        response_payload: body
      });
      return new Response(JSON.stringify({ success: true, message: 'Sem referência de reserva' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Map statuses
    const paymentStatus = mapMpStatusToPaymentStatus(payment.status);
    const reservationPaymentStatus = mapToReservationPaymentStatus(payment.status);

    console.log('=== MAPEAMENTO DE STATUS ===');
    console.log(`MP Status: ${payment.status} -> Payment Status: ${paymentStatus}`);
    console.log(`MP Status: ${payment.status} -> Reservation Payment Status: ${reservationPaymentStatus}`);

    // Update payments table
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        mercado_pago_payment_id: payment.id.toString(),
        payment_date: payment.date_approved || null,
        amount: payment.transaction_amount,
        payer_email: payment.payer?.email || null,
        payment_method: payment.payment_method_id || payment.payment_type_id,
        updated_at: new Date().toISOString(),
      })
      .eq('reservation_id', reservationId);

    if (paymentUpdateError) {
      console.error('Erro ao atualizar payments:', paymentUpdateError);
    } else {
      console.log(`Payments atualizado com sucesso para reservation_id: ${reservationId}`);
    }

    // Update reservations table
    const reservationUpdateStatus = payment.status === 'approved' ? 'confirmed' : 
                                   payment.status === 'rejected' ? 'cancelled' : 'pending';

    const { error: reservationUpdateError } = await supabase
      .from('reservations')
      .update({
        status: reservationUpdateStatus,
        payment_status: reservationPaymentStatus,
        payment_reference: payment.id.toString(),
        payment_method: payment.payment_method_id || payment.payment_type_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (reservationUpdateError) {
      console.error('Erro ao atualizar reservations:', reservationUpdateError);
    } else {
      console.log(`Reservations atualizado com sucesso para id: ${reservationId}`);
    }

    // Log the webhook processing
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      action: 'webhook_notification',
      status: payment.status,
      response_payload: {
        ...body,
        processed_payment: {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          transaction_amount: payment.transaction_amount,
          payer_email: payment.payer?.email,
          mapped_payment_status: paymentStatus,
          mapped_reservation_status: reservationPaymentStatus
        }
      }
    });

    console.log('=== WEBHOOK PROCESSADO COM SUCESSO ===');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processado',
        payment_id: paymentId,
        reservation_id: reservationId,
        status: payment.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('=== ERRO NO WEBHOOK ===');
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Always return 200 to avoid MP retry storms
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Erro interno processado',
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
