import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    console.log('=== CREATE-CARD-PAYMENT INICIADO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      bungalow_id,
      checkin,
      checkout,
      guests,
      full_name,
      email,
      phone,
      cpf,
      date_of_birth,
      is_foreign,
      foreign_passport,
      foreign_nationality,
      total_amount,
      card_token,
      card_brand,
      installments = 1,
      package_id
    } = body;

    // Validações
    if (!bungalow_id || !checkin || !checkout || !email) {
      throw new Error('Campos obrigatórios: bungalow_id, checkin, checkout, email');
    }

    if (!card_token) {
      throw new Error('card_token é obrigatório para pagamento com cartão');
    }

    const amount = parseFloat(total_amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('total_amount deve ser um número válido maior que zero');
    }

    const cleanCpf = cpf?.replace(/\D/g, '') || '';
    if (!cleanCpf || cleanCpf.length !== 11) {
      throw new Error('CPF é obrigatório para pagamento com cartão');
    }

    // 1. Verificar reserva existente
    console.log('=== VERIFICANDO RESERVA EXISTENTE ===');
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_id', bungalow_id)
      .eq('check_in', checkin)
      .eq('check_out', checkout)
      .eq('guest_email', email)
      .eq('status', 'pending')
      .single();

    let reservationId: string;

    if (existingReservation) {
      console.log('Reserva existente encontrada:', existingReservation.id);
      reservationId = existingReservation.id;
    } else {
      // 2. Criar pré-reserva
      console.log('=== CRIANDO PRÉ-RESERVA ===');
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          room_id: bungalow_id,
          check_in: checkin,
          check_out: checkout,
          guests: guests || 1,
          guest_name: full_name,
          guest_email: email,
          guest_phone: phone,
          cpf: cleanCpf,
          payer_cpf: cleanCpf,
          payer_email: email,
          payer_name: full_name,
          birth_date: date_of_birth || null,
          is_foreign: is_foreign || false,
          passport: foreign_passport || null,
          nationality: foreign_nationality || null,
          payment_method: 'credit_card',
          total_price: amount,
          status: 'pending',
          payment_status: 'pending',
          package_id: package_id || null
        })
        .select()
        .single();

      if (reservationError) {
        console.error('Erro ao criar reserva:', reservationError);
        throw new Error('Falha ao criar pré-reserva: ' + reservationError.message);
      }

      reservationId = reservation.id;
      console.log('Reserva criada:', reservationId);
    }

    // 3. Criar pagamento com cartão no Mercado Pago
    console.log('=== CRIANDO PAGAMENTO CARTÃO NO MERCADO PAGO ===');
    const idempotencyKey = crypto.randomUUID();

    const mpPayload = {
      transaction_amount: amount,
      token: card_token,
      installments: parseInt(String(installments)),
      payment_method_id: card_brand || 'master',
      external_reference: reservationId,
      description: `Reserva Pousada Arara Azul - ${full_name}`,
      notification_url: webhookUrl,
      payer: {
        email: email,
        first_name: full_name?.split(' ')[0] || 'Cliente',
        last_name: full_name?.split(' ').slice(1).join(' ') || 'Pousada',
        identification: {
          type: 'CPF',
          number: cleanCpf
        }
      }
    };

    console.log('MP Card Payload:', JSON.stringify(mpPayload, null, 2));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(mpPayload)
    });

    const mpData = await mpResponse.json();
    console.log('MP Card Response Status:', mpResponse.status);
    console.log('MP Card Response:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      console.error('Erro Mercado Pago Card:', mpData);
      
      await supabase
        .from('reservations')
        .update({ status: 'failed', payment_status: 'failed' })
        .eq('id', reservationId);

      // Log de erro
      await supabase.from('payment_logs').insert({
        reservation_id: reservationId,
        action: 'card_payment_failed',
        status: 'error',
        error_code: mpData?.error || 'MP_ERROR',
        error_message: mpData?.message || mpData?.cause?.[0]?.description || 'Erro na API do Mercado Pago',
        request_payload: { ...mpPayload, token: '[REDACTED]' },
        response_payload: mpData
      });

      throw new Error(mpData?.message || mpData?.cause?.[0]?.description || 'Erro ao processar pagamento com cartão');
    }

    const mpPaymentId = mpData.id?.toString();
    const mpStatus = mpData.status;
    const mpStatusDetail = mpData.status_detail;

    // Mapear status
    let paymentStatus = 'pending';
    let reservationStatus = 'pending';

    if (mpStatus === 'approved') {
      paymentStatus = 'paid';
      reservationStatus = 'confirmed';
    } else if (mpStatus === 'rejected') {
      paymentStatus = 'failed';
      reservationStatus = 'cancelled';
    }

    // 4. Registrar pagamento na tabela payments
    console.log('=== REGISTRANDO PAGAMENTO CARTÃO ===');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        reservation_id: reservationId,
        mercado_pago_payment_id: mpPaymentId,
        mp_payment_id: mpPaymentId,
        transaction_id: mpPaymentId,
        payment_method: 'credit_card',
        status: paymentStatus,
        status_detail: mpStatusDetail,
        amount: amount,
        total_amount: amount,
        paid_amount: mpStatus === 'approved' ? amount : null,
        payer_email: email,
        payer_name: full_name,
        payer_cpf: cleanCpf,
        installments: parseInt(String(installments))
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Erro ao registrar pagamento:', paymentError);
    }

    // 5. Atualizar reserva com dados do pagamento
    await supabase
      .from('reservations')
      .update({
        mp_transaction_id: mpPaymentId,
        payment_reference: mpPaymentId,
        status: reservationStatus,
        payment_status: paymentStatus
      })
      .eq('id', reservationId);

    // 6. Log de sucesso/resultado
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      payment_id: payment?.id,
      action: `card_payment_${mpStatus}`,
      status: mpStatus,
      request_payload: { ...mpPayload, token: '[REDACTED]' },
      response_payload: mpData
    });

    // 7. Resposta
    const response: Record<string, any> = {
      success: mpStatus !== 'rejected',
      reservation_id: reservationId,
      payment_id: payment?.id || mpPaymentId,
      mp_payment_id: mpPaymentId,
      status: mpStatus,
      status_detail: mpStatusDetail,
      payment_status: paymentStatus,
      card: {
        last_four_digits: mpData.card?.last_four_digits,
        first_six_digits: mpData.card?.first_six_digits,
        cardholder: mpData.card?.cardholder?.name
      }
    };

    // Mensagens de erro para status rejected
    if (mpStatus === 'rejected') {
      response.success = false;
      response.error_message = getCardErrorMessage(mpStatusDetail);
    }

    console.log('=== CREATE-CARD-PAYMENT CONCLUÍDO ===');
    console.log('Response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: mpStatus === 'rejected' ? 400 : 200
    });

  } catch (error) {
    console.error('=== ERRO CREATE-CARD-PAYMENT ===');
    console.error('Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});

// Helper para mensagens de erro de cartão
function getCardErrorMessage(statusDetail: string): string {
  const messages: Record<string, string> = {
    'cc_rejected_bad_filled_card_number': 'Número do cartão inválido',
    'cc_rejected_bad_filled_date': 'Data de validade inválida',
    'cc_rejected_bad_filled_other': 'Dados do cartão inválidos',
    'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
    'cc_rejected_blacklist': 'Cartão não permitido',
    'cc_rejected_call_for_authorize': 'Autorização necessária - entre em contato com seu banco',
    'cc_rejected_card_disabled': 'Cartão desabilitado - entre em contato com seu banco',
    'cc_rejected_card_error': 'Erro no cartão - tente outro cartão',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado',
    'cc_rejected_high_risk': 'Pagamento recusado por segurança',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente',
    'cc_rejected_invalid_installments': 'Parcelas não permitidas para este cartão',
    'cc_rejected_max_attempts': 'Limite de tentativas excedido - tente outro cartão',
    'cc_rejected_other_reason': 'Pagamento recusado - tente outro cartão'
  };

  return messages[statusDetail] || 'Pagamento recusado - verifique os dados e tente novamente';
}
