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
    console.log('=== MERCADOPAGO CHECKOUT INICIADO ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Extract parameters from request
    const {
      reservation_id,
      amount,
      payer_name,
      payer_email,
      payer_cpf,
      payment_method, // "credit_card" or "pix"
      card_token,
      installments = 1,
      payment_method_id, // e.g., "master", "visa" - from card BIN
      description = 'Reserva - Pousada Arara Azul'
    } = body;

    // Validate required fields
    if (!reservation_id) {
      throw new Error('reservation_id é obrigatório');
    }
    if (!payer_email) {
      throw new Error('payer_email é obrigatório');
    }
    if (!payer_cpf) {
      throw new Error('payer_cpf é obrigatório');
    }
    if (!payment_method || !['credit_card', 'pix'].includes(payment_method)) {
      throw new Error('payment_method deve ser "credit_card" ou "pix"');
    }

    // Validate and parse amount as number
    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      throw new Error('amount deve ser um número válido maior que zero');
    }

    // CPF validation (basic)
    const cleanCpf = payer_cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new Error('CPF inválido');
    }

    // Idempotency key
    const idempotencyKey = crypto.randomUUID();

    console.log('=== DADOS DO PAGAMENTO ===');
    console.log('Reservation ID:', reservation_id);
    console.log('Amount (validated number):', transactionAmount);
    console.log('Payment Method:', payment_method);
    console.log('Payer Email:', payer_email);
    console.log('Payer CPF:', cleanCpf);

    let mpResponse;
    let mpData;
    let mpPaymentId: string | undefined;
    let mpStatus: string = 'pending';
    let mpStatusDetail: string | undefined;

    // ========== CREDIT CARD - Use Payments API (POST /v1/payments) ==========
    if (payment_method === 'credit_card') {
      console.log('Processando pagamento via CARTÃO DE CRÉDITO (Payments API)...');

      if (!card_token) {
        throw new Error('card_token é obrigatório para pagamento com cartão');
      }

      // Build Payments API payload for credit card
      const cardPayload = {
        transaction_amount: transactionAmount,
        token: card_token,
        installments: parseInt(String(installments)),
        payment_method_id: payment_method_id || "master",
        payer: {
          email: payer_email,
          first_name: payer_name?.split(' ')[0] || 'Cliente',
          last_name: payer_name?.split(' ').slice(1).join(' ') || 'Pousada',
          identification: {
            type: 'CPF',
            number: cleanCpf
          }
        },
        external_reference: reservation_id,
        description
      };

      console.log('Payments API (Credit Card) payload:', JSON.stringify(cardPayload, null, 2));

      mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(cardPayload)
      });

      mpData = await mpResponse.json();
      console.log('Payments API (Credit Card) response:', JSON.stringify(mpData, null, 2));

      // Extract payment info from Payments API response
      mpPaymentId = mpData?.id?.toString();
      mpStatus = mpData?.status || 'pending';
      mpStatusDetail = mpData?.status_detail;

    }
    // ========== PIX - Use Payments API (POST /v1/payments) ==========
    else if (payment_method === 'pix') {
      console.log('Processando pagamento via PIX (Payments API)...');

      // PIX payload with validated number amount
      const pixPayload = {
        transaction_amount: transactionAmount,
        payment_method_id: "pix",
        payer: {
          email: payer_email,
          first_name: payer_name?.split(' ')[0] || 'Cliente',
          last_name: payer_name?.split(' ').slice(1).join(' ') || 'Pousada',
          identification: {
            type: 'CPF',
            number: cleanCpf
          }
        },
        external_reference: reservation_id,
        description
      };

      console.log('Payments API (PIX) payload:', JSON.stringify(pixPayload, null, 2));

      mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(pixPayload)
      });

      mpData = await mpResponse.json();
      console.log('Payments API (PIX) response:', JSON.stringify(mpData, null, 2));

      // Extract payment info from Payments API response
      mpPaymentId = mpData?.id?.toString();
      mpStatus = mpData?.status || 'pending';
      mpStatusDetail = mpData?.status_detail;
    }

    // Check for API errors
    if (!mpResponse!.ok) {
      console.error('Erro na API Mercado Pago:', mpData);
      
      // Log error
      await supabase.from('payment_logs').insert({
        reservation_id,
        action: 'checkout_error',
        status: 'error',
        error_code: mpData?.error || mpData?.status?.toString() || 'API_ERROR',
        error_message: mpData?.message || mpData?.cause?.[0]?.description || JSON.stringify(mpData),
        request_payload: body,
        response_payload: mpData
      });

      throw new Error(mpData?.message || mpData?.cause?.[0]?.description || 'Erro na API do Mercado Pago');
    }

    console.log('=== PAGAMENTO PROCESSADO ===');
    console.log('MP Payment ID (transaction_id):', mpPaymentId);
    console.log('Status:', mpStatus);
    console.log('Status Detail:', mpStatusDetail);

    // Map MP status to English database statuses
    // payments.status: pending, paid, failed, refunded
    const mappedPaymentStatus = mpStatus === 'approved' || mpStatus === 'processed' ? 'paid' 
      : ['rejected', 'cancelled'].includes(mpStatus) ? 'failed'
      : mpStatus === 'refunded' ? 'refunded'
      : 'pending';

    // reservations.payment_status: pending, paid, refunded (DB constraint - no 'failed')
    const mappedReservationStatus = mpStatus === 'approved' || mpStatus === 'processed' ? 'paid' 
      : mpStatus === 'refunded' ? 'refunded'
      : 'pending';

    console.log('=== MAPEAMENTO DE STATUS ===');
    console.log(`MP Status: "${mpStatus}" -> Payment Status: "${mappedPaymentStatus}"`);
    console.log(`MP Status: "${mpStatus}" -> Reservation Status: "${mappedReservationStatus}"`);

    // Upsert payment record with correct payment_method (credit_card or pix)
    const paymentData = {
      reservation_id,
      amount: transactionAmount,
      status: mappedPaymentStatus,
      status_detail: mpStatusDetail || null,
      payment_method: payment_method, // Always "credit_card" or "pix"
      method: payment_method,
      transaction_id: mpPaymentId || null, // This is the key field!
      mercado_pago_payment_id: mpPaymentId || null,
      payer_name: payer_name || null,
      payer_email: payer_email,
      payer_cpf: cleanCpf,
      total_amount: transactionAmount,
      paid_amount: ['approved', 'processed'].includes(mpStatus) ? transactionAmount : null,
      installments: parseInt(String(installments)),
      payment_date: mpData?.date_approved || mpData?.date_created || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('=== SALVANDO PAYMENT ===');
    console.log('transaction_id:', mpPaymentId);
    console.log('payment_method:', payment_method);

    const { error: paymentInsertError } = await supabase
      .from('payments')
      .upsert(paymentData, { onConflict: 'reservation_id' });

    if (paymentInsertError) {
      console.error('Erro ao inserir/atualizar payment:', paymentInsertError);
    } else {
      console.log('✓ Payment salvo com sucesso');
    }

    // Update reservation payment status
    const { error: reservationUpdateError } = await supabase
      .from('reservations')
      .update({
        payment_status: mappedReservationStatus,
        payment_method: payment_method, // Always "credit_card" or "pix"
        payment_reference: mpPaymentId || null,
        status: ['approved', 'processed'].includes(mpStatus) ? 'confirmed' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation_id);

    if (reservationUpdateError) {
      console.error('Erro ao atualizar reservation:', reservationUpdateError);
    } else {
      console.log('✓ Reservation atualizada com sucesso');
    }

    // Log success
    await supabase.from('payment_logs').insert({
      reservation_id,
      action: 'checkout_success',
      status: mpStatus,
      request_payload: body,
      response_payload: mpData
    });

    // Build response based on payment method
    const response: any = {
      success: true,
      reservation_id,
      payment_id: mpPaymentId,
      transaction_id: mpPaymentId,
      status: mpStatus,
      status_detail: mpStatusDetail,
      payment_method: payment_method // Return the correct payment method
    };

    // Add PIX-specific data (qr_code, qr_code_base64, ticket_url)
    if (payment_method === 'pix' && mpData?.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code || null,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64 || null,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url || null
      };
      console.log('PIX QR Code gerado com sucesso');
      console.log('ticket_url:', response.pix.ticket_url);
    }

    // Add credit card specific data
    if (payment_method === 'credit_card') {
      response.card = {
        status: mpStatus,
        status_detail: mpStatusDetail,
        installments: mpData?.installments || installments,
        order_id: mpData?.id
      };
    }

    console.log('=== CHECKOUT CONCLUÍDO COM SUCESSO ===');
    console.log('transaction_id salvo:', mpPaymentId);
    console.log('payment_method salvo:', payment_method);
    console.log('Response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('=== ERRO NO CHECKOUT ===');
    console.error('Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return new Response(JSON.stringify({
      success: false,
      error_code: 'CHECKOUT_ERROR',
      error_message: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
