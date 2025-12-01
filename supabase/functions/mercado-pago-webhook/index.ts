import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for idempotency (30 seconds TTL)
const processedPayments = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 30000; // 30 seconds

// Clean old entries from cache
function cleanIdempotencyCache() {
  const now = Date.now();
  for (const [key, timestamp] of processedPayments.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      processedPayments.delete(key);
    }
  }
}

// Check idempotency - returns true if already processed recently
function isRecentlyProcessed(paymentId: string, action: string): boolean {
  cleanIdempotencyCache();
  const key = `${paymentId}_${action}`;
  return processedPayments.has(key);
}

// Mark as processed
function markAsProcessed(paymentId: string, action: string) {
  const key = `${paymentId}_${action}`;
  processedPayments.set(key, Date.now());
}

// Map MP status to payments table status
function mapMpStatusToPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'approved';
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pending';
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
}

// Map MP status to reservations payment_status (must match DB constraint)
function mapToReservationPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'paid';
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pending';
    case 'rejected':
    case 'cancelled':
      return 'failed';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
}

// Get action description for audit log
function getActionDescription(action: string, mpStatus: string, reservationId: string): string {
  switch (action) {
    case 'payment.created':
      return `Pagamento criado para reserva ${reservationId}`;
    case 'payment.updated':
      return `Pagamento atualizado para reserva ${reservationId} - Status: ${mpStatus}`;
    case 'payment.approved':
      return `Pagamento APROVADO para reserva ${reservationId}`;
    case 'payment.refunded':
      return `Pagamento REEMBOLSADO para reserva ${reservationId}`;
    default:
      return `Webhook recebido (${action}) para reserva ${reservationId} - Status: ${mpStatus}`;
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
    console.log('Timestamp:', new Date().toISOString());
    console.log('Tipo:', body.type);
    console.log('Action:', body.action);
    console.log('Data ID:', body.data?.id);
    console.log('Full body:', JSON.stringify(body, null, 2));

    // Only process payment notifications
    if (body.type !== 'payment') {
      console.log(`Tipo de notificação "${body.type}" não é payment, ignorando`);
      return new Response(JSON.stringify({ success: true, message: 'Notificação ignorada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract payment_id from body.data.id
    const paymentId = body.data?.id?.toString();
    const webhookAction = body.action || 'payment.unknown';

    if (!paymentId) {
      console.log('ID de pagamento ausente no webhook');
      await supabase.from('payment_logs').insert({
        action: 'webhook_missing_payment_id',
        status: 'error',
        error_message: 'Payment ID missing in webhook notification',
        request_payload: body
      });
      return new Response(JSON.stringify({ success: true, message: 'ID ausente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // ============================================
    // IDEMPOTENCY CHECK - Prevent duplicate processing
    // ============================================
    if (isRecentlyProcessed(paymentId, webhookAction)) {
      console.log(`⚠️ IDEMPOTÊNCIA: Payment ${paymentId} com action ${webhookAction} já processado nos últimos 30s`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Notificação duplicada ignorada (idempotência)',
        payment_id: paymentId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`=== PROCESSANDO EVENTO: ${webhookAction} ===`);
    console.log(`Payment ID: ${paymentId}`);

    // ============================================
    // FETCH REAL PAYMENT DATA FROM MERCADO PAGO
    // GET /v1/payments/{PAYMENT_ID}
    // ============================================
    console.log(`Consultando GET /v1/payments/${paymentId}`);
    
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error(`Erro ao buscar pagamento: ${mpResponse.status} - ${errorText}`);
      
      await supabase.from('payment_logs').insert({
        action: 'webhook_mp_api_error',
        status: 'error',
        error_code: mpResponse.status.toString(),
        error_message: `Failed to fetch payment from MP API: ${errorText}`,
        response_payload: { webhook_body: body, mp_error: errorText, payment_id: paymentId }
      });
      
      // Log to audit even on error
      await supabase.from('activity_log').insert({
        user_id: null,
        user_email: 'system_webhook',
        action: 'webhook_error',
        description: `Erro ao consultar pagamento ${paymentId} na API do Mercado Pago`,
        entity_type: 'payment',
        metadata: { payment_id: paymentId, error_status: mpResponse.status, error: errorText }
      });
      
      // Mark as processed to prevent retries on same error
      markAsProcessed(paymentId, webhookAction);
      
      return new Response(JSON.stringify({ success: true, message: 'Erro ao consultar MP API' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const payment = await mpResponse.json();
    
    // ============================================
    // EXTRACT REQUIRED FIELDS FROM PAYMENT
    // ============================================
    const mpStatus = payment.status;
    const mpStatusDetail = payment.status_detail;
    const transactionAmount = payment.transaction_amount;
    const paymentMethodId = payment.payment_method?.id || payment.payment_method_id;
    const paymentMethodType = payment.payment_method?.type || payment.payment_type_id;
    const payerEmail = payment.payer?.email;
    const payerFirstName = payment.payer?.first_name || '';
    const payerLastName = payment.payer?.last_name || '';
    const payerFullName = `${payerFirstName} ${payerLastName}`.trim();
    const reservationId = payment.external_reference;
    const dateApproved = payment.date_approved;
    const dateCreated = payment.date_created;

    console.log('=== DADOS EXTRAÍDOS DO PAGAMENTO MP ===');
    console.log('Payment ID:', payment.id);
    console.log('Status:', mpStatus);
    console.log('Status Detail:', mpStatusDetail);
    console.log('Transaction Amount:', transactionAmount);
    console.log('Payment Method ID:', paymentMethodId);
    console.log('Payment Method Type:', paymentMethodType);
    console.log('Payer Email:', payerEmail);
    console.log('Payer Name:', payerFullName);
    console.log('External Reference (Reservation ID):', reservationId);
    console.log('Date Approved:', dateApproved);

    if (!reservationId) {
      console.log('ATENÇÃO: external_reference (reservation_id) não encontrado');
      await supabase.from('payment_logs').insert({
        action: `webhook_${webhookAction}`,
        status: mpStatus,
        error_message: 'No external_reference (reservation_id) in payment',
        response_payload: { payment_id: paymentId, status: mpStatus, payer_email: payerEmail }
      });
      
      await supabase.from('activity_log').insert({
        user_id: null,
        user_email: 'system_webhook',
        action: 'webhook_missing_reference',
        description: `Pagamento ${paymentId} sem external_reference`,
        entity_type: 'payment',
        metadata: { payment_id: paymentId, status: mpStatus, payer_email: payerEmail }
      });
      
      markAsProcessed(paymentId, webhookAction);
      
      return new Response(JSON.stringify({ success: true, message: 'Sem referência de reserva' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Map statuses
    const mappedPaymentStatus = mapMpStatusToPaymentStatus(mpStatus);
    const mappedReservationStatus = mapToReservationPaymentStatus(mpStatus);

    console.log('=== MAPEAMENTO DE STATUS ===');
    console.log(`MP Status: "${mpStatus}" -> Payment Status: "${mappedPaymentStatus}"`);
    console.log(`MP Status: "${mpStatus}" -> Reservation Payment Status: "${mappedReservationStatus}"`);

    // ============================================
    // UPDATE PAYMENTS TABLE
    // ============================================
    console.log('=== ATUALIZANDO TABELA PAYMENTS ===');
    
    const paymentUpdateData = {
      status: mappedPaymentStatus,
      status_detail: mpStatusDetail,
      paid_amount: mpStatus === 'approved' ? transactionAmount : null,
      transaction_id: payment.id.toString(),
      payment_method: paymentMethodId || paymentMethodType,
      payer_email: payerEmail,
      payer_name: payerFullName || null,
      mercado_pago_payment_id: payment.id.toString(),
      total_amount: transactionAmount,
      payment_date: dateApproved || dateCreated,
      updated_at: new Date().toISOString(),
    };

    console.log('Dados para atualização payments:', JSON.stringify(paymentUpdateData, null, 2));

    const { data: paymentData, error: paymentUpdateError } = await supabase
      .from('payments')
      .update(paymentUpdateData)
      .eq('reservation_id', reservationId)
      .select();

    if (paymentUpdateError) {
      console.error('Erro ao atualizar payments:', paymentUpdateError);
      await supabase.from('payment_logs').insert({
        reservation_id: reservationId,
        action: 'webhook_payment_update_error',
        status: 'error',
        error_message: paymentUpdateError.message,
        response_payload: { payment_id: paymentId, attempted_data: paymentUpdateData }
      });
    } else {
      console.log(`✓ Payments atualizado com sucesso. Registros: ${paymentData?.length || 0}`);
    }

    // ============================================
    // UPDATE RESERVATIONS TABLE
    // ============================================
    console.log('=== ATUALIZANDO TABELA RESERVATIONS ===');
    
    const reservationStatus = mpStatus === 'approved' ? 'confirmed' : 
                             mpStatus === 'rejected' || mpStatus === 'cancelled' ? 'cancelled' : 
                             mpStatus === 'refunded' ? 'refunded' : 'pending';

    const reservationUpdateData = {
      payment_status: mappedReservationStatus,
      status: reservationStatus,
      payment_reference: payment.id.toString(),
      payment_method: paymentMethodId || paymentMethodType,
      updated_at: new Date().toISOString(),
    };

    console.log('Dados para atualização reservations:', JSON.stringify(reservationUpdateData, null, 2));

    const { data: reservationData, error: reservationUpdateError } = await supabase
      .from('reservations')
      .update(reservationUpdateData)
      .eq('id', reservationId)
      .select('id, guest_name, guest_email, room_name');

    if (reservationUpdateError) {
      console.error('Erro ao atualizar reservations:', reservationUpdateError);
      await supabase.from('payment_logs').insert({
        reservation_id: reservationId,
        action: 'webhook_reservation_update_error',
        status: 'error',
        error_message: reservationUpdateError.message,
        response_payload: { payment_id: paymentId, attempted_data: reservationUpdateData }
      });
    } else {
      console.log(`✓ Reservations atualizado com sucesso. Registros: ${reservationData?.length || 0}`);
    }

    // ============================================
    // LOG IN PAYMENT_LOGS TABLE
    // ============================================
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      action: `webhook_${webhookAction}`,
      status: mpStatus,
      response_payload: {
        webhook_action: webhookAction,
        payment_id: payment.id,
        status: mpStatus,
        status_detail: mpStatusDetail,
        transaction_amount: transactionAmount,
        payment_method: paymentMethodId,
        payment_method_type: paymentMethodType,
        payer_email: payerEmail,
        payer_name: payerFullName,
        mapped_payment_status: mappedPaymentStatus,
        mapped_reservation_status: mappedReservationStatus,
        date_approved: dateApproved,
        date_created: dateCreated,
        processed_at: new Date().toISOString(),
      }
    });

    // ============================================
    // LOG IN ACTIVITY_LOG (AUDIT) TABLE
    // ============================================
    console.log('=== REGISTRANDO AUDITORIA ===');
    
    const auditDescription = getActionDescription(webhookAction, mpStatus, reservationId);
    const guestInfo = reservationData?.[0];

    const { error: auditError } = await supabase.from('activity_log').insert({
      user_id: null,
      user_email: 'system_webhook',
      action: webhookAction === 'payment.approved' ? 'payment_approved' : 
              webhookAction === 'payment.refunded' ? 'payment_refunded' : 
              webhookAction === 'payment.created' ? 'payment_created' : 'payment_updated',
      description: auditDescription,
      entity_type: 'payment',
      entity_id: reservationId,
      metadata: {
        mp_payment_id: payment.id,
        mp_status: mpStatus,
        mp_status_detail: mpStatusDetail,
        transaction_amount: transactionAmount,
        payment_method: paymentMethodId,
        payment_method_type: paymentMethodType,
        payer_email: payerEmail,
        payer_name: payerFullName,
        guest_name: guestInfo?.guest_name || null,
        guest_email: guestInfo?.guest_email || null,
        room_name: guestInfo?.room_name || null,
        webhook_action: webhookAction,
        processed_at: new Date().toISOString(),
      }
    });

    if (auditError) {
      console.error('Erro ao registrar auditoria:', auditError);
    } else {
      console.log('✓ Auditoria registrada com sucesso');
    }

    // Mark as processed for idempotency
    markAsProcessed(paymentId, webhookAction);

    console.log('=== WEBHOOK PROCESSADO COM SUCESSO ===');
    console.log(`Evento: ${webhookAction}`);
    console.log(`Payment ID: ${paymentId}`);
    console.log(`Reservation ID: ${reservationId}`);
    console.log(`Status Final: ${mpStatus} -> ${mappedPaymentStatus}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processado com sucesso',
        event: webhookAction,
        payment_id: paymentId,
        reservation_id: reservationId,
        mp_status: mpStatus,
        mapped_status: mappedPaymentStatus,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('=== ERRO CRÍTICO NO WEBHOOK ===');
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await supabase.from('payment_logs').insert({
        action: 'webhook_critical_error',
        status: 'error',
        error_message: errorMessage,
      });
      
      await supabase.from('activity_log').insert({
        user_id: null,
        user_email: 'system_webhook',
        action: 'webhook_critical_error',
        description: `Erro crítico no processamento de webhook: ${errorMessage}`,
        entity_type: 'system',
        metadata: { error: errorMessage, timestamp: new Date().toISOString() }
      });
    } catch (logError) {
      console.error('Erro ao logar erro:', logError);
    }
    
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
