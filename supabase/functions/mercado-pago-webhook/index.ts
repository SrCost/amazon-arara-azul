import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for idempotency (30 seconds TTL)
const processedPayments = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 30000;

function cleanIdempotencyCache() {
  const now = Date.now();
  for (const [key, timestamp] of processedPayments.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      processedPayments.delete(key);
    }
  }
}

function isRecentlyProcessed(paymentId: string, action: string): boolean {
  cleanIdempotencyCache();
  const key = `${paymentId}_${action}`;
  return processedPayments.has(key);
}

function markAsProcessed(paymentId: string, action: string) {
  const key = `${paymentId}_${action}`;
  processedPayments.set(key, Date.now());
}

// Map MP status to payments table status (English: pending, paid, failed, refunded)
function mapMpStatusToPaymentStatus(mpStatus: string): string {
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

// Map MP status to reservations payment_status (DB constraint: pending, paid, refunded ONLY)
function mapToReservationPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'paid';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      // DB constraint only allows: pending, paid, refunded
      return 'pending';
  }
}

// Convert payment_method_type to correct value (credit_card or pix)
function normalizePaymentMethod(paymentMethodType: string | null, paymentMethodId: string | null): string {
  // Check type first
  if (paymentMethodType === 'credit_card' || paymentMethodType === 'debit_card') {
    return 'credit_card';
  }
  if (paymentMethodType === 'bank_transfer' || paymentMethodId === 'pix') {
    return 'pix';
  }
  // Card brands indicate credit card
  const cardBrands = ['master', 'visa', 'amex', 'elo', 'hipercard', 'diners'];
  if (paymentMethodId && cardBrands.includes(paymentMethodId.toLowerCase())) {
    return 'credit_card';
  }
  return paymentMethodType || 'credit_card';
}

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

    if (body.type !== 'payment') {
      console.log(`Tipo de notificação "${body.type}" não é payment, ignorando`);
      return new Response(JSON.stringify({ success: true, message: 'Notificação ignorada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const paymentId = body.data?.id?.toString();
    const webhookAction = body.action || 'payment.unknown';

    if (!paymentId) {
      console.log('ID de pagamento ausente no webhook');
      return new Response(JSON.stringify({ success: true, message: 'ID ausente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (isRecentlyProcessed(paymentId, webhookAction)) {
      console.log(`⚠️ IDEMPOTÊNCIA: Payment ${paymentId} já processado nos últimos 30s`);
      return new Response(JSON.stringify({ success: true, message: 'Duplicado ignorado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`=== PROCESSANDO EVENTO: ${webhookAction} ===`);
    console.log(`Payment ID: ${paymentId}`);

    // Fetch real payment data from Mercado Pago
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
      markAsProcessed(paymentId, webhookAction);
      return new Response(JSON.stringify({ success: true, message: 'Erro ao consultar MP' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const payment = await mpResponse.json();
    
    // Extract required fields
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

    // Normalize payment method to "credit_card" or "pix"
    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethodType, paymentMethodId);

    console.log('=== DADOS EXTRAÍDOS DO PAGAMENTO MP ===');
    console.log('🔑 TRANSACTION_ID (payment.id):', payment.id);
    console.log('📊 Status:', mpStatus);
    console.log('📝 Status Detail:', mpStatusDetail);
    console.log('💰 Transaction Amount:', transactionAmount);
    console.log('💳 Payment Method ID:', paymentMethodId);
    console.log('💳 Payment Method Type:', paymentMethodType);
    console.log('💳 Normalized Payment Method:', normalizedPaymentMethod);
    console.log('📧 Payer Email:', payerEmail || '(não informado)');
    console.log('👤 Payer Name:', payerFullName || '(não informado)');
    console.log('🔗 External Reference (Reservation ID):', reservationId);
    console.log('📅 Date Approved:', dateApproved || '(pendente)');

    if (!reservationId) {
      console.log('ATENÇÃO: external_reference (reservation_id) não encontrado');
      markAsProcessed(paymentId, webhookAction);
      return new Response(JSON.stringify({ success: true, message: 'Sem referência' }), {
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

    // Update payments table
    console.log('=== ATUALIZANDO TABELA PAYMENTS ===');
    console.log('🔑 transaction_id a salvar:', payment.id?.toString());
    console.log('💳 payment_method a salvar:', normalizedPaymentMethod);
    
    const paymentUpdateData = {
      status: mappedPaymentStatus,
      status_detail: mpStatusDetail || null,
      paid_amount: mpStatus === 'approved' ? transactionAmount : null,
      transaction_id: payment.id?.toString() || null, // CRITICAL: Save transaction_id
      payment_method: normalizedPaymentMethod, // "credit_card" or "pix"
      method: normalizedPaymentMethod,
      payer_email: payerEmail || null,
      payer_name: payerFullName || null,
      mercado_pago_payment_id: payment.id?.toString() || null,
      total_amount: transactionAmount || null,
      payment_date: dateApproved || dateCreated || null,
      updated_at: new Date().toISOString(),
    };

    console.log('Dados completos:', JSON.stringify(paymentUpdateData, null, 2));

    const { data: paymentData, error: paymentUpdateError } = await supabase
      .from('payments')
      .update(paymentUpdateData)
      .eq('reservation_id', reservationId)
      .select();

    if (paymentUpdateError) {
      console.error('Erro ao atualizar payments:', paymentUpdateError);
    } else {
      console.log(`✓ Payments atualizado com sucesso. Registros: ${paymentData?.length || 0}`);
    }

    // Update reservations table
    console.log('=== ATUALIZANDO TABELA RESERVATIONS ===');
    
    const reservationStatus = mpStatus === 'approved' ? 'confirmed' : 
                             mpStatus === 'rejected' || mpStatus === 'cancelled' ? 'cancelled' : 
                             mpStatus === 'refunded' ? 'refunded' : 'pending';

    const reservationUpdateData = {
      payment_status: mappedReservationStatus,
      status: reservationStatus,
      payment_reference: payment.id.toString(),
      payment_method: normalizedPaymentMethod, // "credit_card" or "pix"
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
    } else {
      console.log(`✓ Reservations atualizado com sucesso. Registros: ${reservationData?.length || 0}`);
    }

    // Log to payment_logs
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
        payment_method: normalizedPaymentMethod,
        payment_method_raw_id: paymentMethodId,
        payment_method_raw_type: paymentMethodType,
        payer_email: payerEmail,
        payer_name: payerFullName,
        mapped_payment_status: mappedPaymentStatus,
        mapped_reservation_status: mappedReservationStatus,
        processed_at: new Date().toISOString(),
      }
    });

    // Log to activity_log (audit)
    console.log('=== REGISTRANDO AUDITORIA ===');
    
    const auditDescription = getActionDescription(webhookAction, mpStatus, reservationId);
    const guestInfo = reservationData?.[0];

    await supabase.from('activity_log').insert({
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
        transaction_id: payment.id,
        mp_status: mpStatus,
        mp_status_detail: mpStatusDetail,
        transaction_amount: transactionAmount,
        payment_method: normalizedPaymentMethod,
        payer_email: payerEmail,
        payer_name: payerFullName,
        guest_name: guestInfo?.guest_name || null,
        guest_email: guestInfo?.guest_email || null,
        room_name: guestInfo?.room_name || null,
        webhook_action: webhookAction,
        processed_at: new Date().toISOString(),
      }
    });

    console.log('✓ Auditoria registrada com sucesso');

    markAsProcessed(paymentId, webhookAction);

    console.log('=== ✅ WEBHOOK PROCESSADO COM SUCESSO ===');
    console.log(`📌 Evento: ${webhookAction}`);
    console.log(`🔑 TRANSACTION_ID SALVO: ${payment.id}`);
    console.log(`💳 PAYMENT_METHOD SALVO: ${normalizedPaymentMethod}`);
    console.log(`📦 Reservation ID: ${reservationId}`);
    console.log(`📊 Status MP: ${mpStatus} -> Payment: ${mappedPaymentStatus} | Reservation: ${mappedReservationStatus}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processado com sucesso',
        event: webhookAction,
        payment_id: paymentId,
        transaction_id: payment.id,
        reservation_id: reservationId,
        mp_status: mpStatus,
        mapped_status: mappedPaymentStatus,
        payment_method: normalizedPaymentMethod,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('=== ERRO NO WEBHOOK ===');
    console.error('Error:', error);

    return new Response(
      JSON.stringify({ success: true, message: 'Erro processado' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
