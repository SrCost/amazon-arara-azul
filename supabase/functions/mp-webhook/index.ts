import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const body = await req.json();
    console.log('=== MP-WEBHOOK RECEBIDO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Body:', JSON.stringify(body, null, 2));

    // Verificar se é um evento de pagamento
    if (!body?.data?.id) {
      console.log('Webhook sem payment ID - ignorando');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data.id;
    const action = body.action || body.type;

    console.log('Payment ID:', paymentId);
    console.log('Action:', action);

    // Buscar detalhes do pagamento na API do MP
    console.log('=== CONSULTANDO PAGAMENTO NO MP ===');
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`
      }
    });

    if (!mpResponse.ok) {
      console.error('Erro ao consultar pagamento:', mpResponse.status);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const mpData = await mpResponse.json();
    console.log('Dados do pagamento MP:', JSON.stringify(mpData, null, 2));

    const reservationId = mpData.external_reference;
    const mpStatus = mpData.status;
    const mpStatusDetail = mpData.status_detail;
    const paymentMethodType = mpData.payment_method?.type || mpData.payment_type_id;

    if (!reservationId) {
      console.log('external_reference não encontrado - ignorando');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    console.log('=== MAPEAMENTO DE STATUS ===');
    console.log('Reservation ID:', reservationId);
    console.log('MP Status:', mpStatus);
    console.log('Payment Method Type:', paymentMethodType);

    // Mapear status do MP para status interno
    let paymentStatus: string;
    let reservationStatus: string;

    switch (mpStatus) {
      case 'approved':
        paymentStatus = 'paid';
        reservationStatus = 'confirmed';
        break;
      case 'pending':
      case 'in_process':
      case 'authorized':
        paymentStatus = 'pending';
        reservationStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
        paymentStatus = 'failed';
        reservationStatus = 'cancelled';
        break;
      case 'refunded':
        paymentStatus = 'refunded';
        reservationStatus = 'cancelled';
        break;
      default:
        paymentStatus = 'pending';
        reservationStatus = 'pending';
    }

    // Normalizar payment_method
    let normalizedPaymentMethod = 'credit_card';
    if (paymentMethodType === 'pix' || paymentMethodType === 'bank_transfer') {
      normalizedPaymentMethod = 'pix';
    }

    console.log('Payment Status mapeado:', paymentStatus);
    console.log('Reservation Status mapeado:', reservationStatus);
    console.log('Payment Method normalizado:', normalizedPaymentMethod);

    // Atualizar tabela payments
    console.log('=== ATUALIZANDO PAYMENTS ===');
    const paymentUpdateData = {
      status: paymentStatus,
      status_detail: mpStatusDetail,
      mp_payment_id: paymentId.toString(),
      mercado_pago_payment_id: paymentId.toString(),
      transaction_id: paymentId.toString(),
      payment_method: normalizedPaymentMethod,
      paid_amount: mpStatus === 'approved' ? mpData.transaction_amount : null,
      updated_at: new Date().toISOString()
    };

    const { data: paymentUpdate, error: paymentError } = await supabase
      .from('payments')
      .update(paymentUpdateData)
      .eq('reservation_id', reservationId)
      .select();

    if (paymentError) {
      console.error('Erro ao atualizar payments:', paymentError);
    } else {
      console.log('Payments atualizado:', paymentUpdate?.length || 0, 'registros');
    }

    // Atualizar tabela reservations
    console.log('=== ATUALIZANDO RESERVATIONS ===');
    const reservationUpdateData = {
      payment_status: paymentStatus,
      status: reservationStatus,
      mp_transaction_id: paymentId.toString(),
      payment_reference: paymentId.toString(),
      payment_method: normalizedPaymentMethod,
      updated_at: new Date().toISOString()
    };

    const { data: reservationUpdate, error: reservationError } = await supabase
      .from('reservations')
      .update(reservationUpdateData)
      .eq('id', reservationId)
      .select();

    if (reservationError) {
      console.error('Erro ao atualizar reservations:', reservationError);
    } else {
      console.log('Reservations atualizado:', reservationUpdate?.length || 0, 'registros');
    }

    // Registrar log de auditoria
    await supabase.from('activity_log').insert({
      user_email: 'system',
      action: 'webhook_payment_update',
      description: `Webhook MP: Pagamento ${paymentId} - Status: ${mpStatus}`,
      entity_type: 'payment',
      entity_id: reservationId,
      metadata: {
        payment_id: paymentId,
        mp_status: mpStatus,
        payment_status: paymentStatus,
        reservation_status: reservationStatus
      }
    });

    console.log('=== MP-WEBHOOK PROCESSADO COM SUCESSO ===');

    // Sempre retornar 200 para evitar reenvios
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('=== ERRO NO MP-WEBHOOK ===');
    console.error('Error:', error);

    // Sempre retornar 200 mesmo em caso de erro
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
