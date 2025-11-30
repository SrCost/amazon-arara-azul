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
      description = 'Reserva - Pousada Arara Azul'
    } = body;

    // Validate required fields
    if (!reservation_id) {
      throw new Error('reservation_id é obrigatório');
    }
    if (!amount || amount <= 0) {
      throw new Error('amount deve ser maior que zero');
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

    // CPF validation (basic)
    const cleanCpf = payer_cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new Error('CPF inválido');
    }

    // Idempotency key
    const idempotencyKey = `${reservation_id}-${Date.now()}`;
    const transactionAmount = parseFloat(amount);

    let mpResponse;
    let mpData;

    // ========== CREDIT CARD - Use Orders API ==========
    if (payment_method === 'credit_card') {
      console.log('Processando pagamento via CARTÃO DE CRÉDITO...');

      if (!card_token) {
        throw new Error('card_token é obrigatório para pagamento com cartão');
      }

      // Build Orders API payload
      const orderPayload = {
        type: "online",
        processing_mode: "automatic",
        total_amount: transactionAmount.toString(),
        external_reference: reservation_id,
        payer: {
          email: payer_email
        },
        transactions: {
          payments: [
            {
              amount: transactionAmount.toString(),
              payment_method: {
                id: "master", // This will be determined by MP based on card
                type: "credit_card",
                token: card_token,
                installments: parseInt(installments)
              }
            }
          ]
        }
      };

      console.log('Orders API payload:', JSON.stringify(orderPayload, null, 2));

      mpResponse = await fetch('https://api.mercadopago.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(orderPayload)
      });

      mpData = await mpResponse.json();
      console.log('Orders API response:', JSON.stringify(mpData, null, 2));

    } 
    // ========== PIX - Use Payments API ==========
    else if (payment_method === 'pix') {
      console.log('Processando pagamento via PIX...');

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

    // Extract payment info
    const mpPaymentId = mpData?.id?.toString() || mpData?.transactions?.payments?.[0]?.id?.toString();
    const mpStatus = mpData?.status || mpData?.transactions?.payments?.[0]?.status || 'pending';
    const mpStatusDetail = mpData?.status_detail || mpData?.transactions?.payments?.[0]?.status_detail;

    console.log('=== PAGAMENTO PROCESSADO ===');
    console.log('MP Payment ID:', mpPaymentId);
    console.log('Status:', mpStatus);
    console.log('Status Detail:', mpStatusDetail);

    // Register payment in database IMMEDIATELY (before confirmation)
    const { error: paymentInsertError } = await supabase.from('payments').upsert({
      reservation_id,
      status: mpStatus === 'approved' ? 'aprovado' : mpStatus === 'rejected' ? 'rejeitado' : 'pendente',
      status_detail: mpStatusDetail,
      payment_method,
      transaction_id: mpPaymentId,
      payer_email,
      payer_cpf: cleanCpf,
      total_amount: transactionAmount,
      paid_amount: mpStatus === 'approved' ? transactionAmount : null,
    }, {
      onConflict: 'reservation_id'
    });

    if (paymentInsertError) {
      console.error('Erro ao inserir/atualizar payment:', paymentInsertError);
    }

    // Update reservation payment status
    const reservationPaymentStatus = mpStatus === 'approved' ? 'pago' 
      : mpStatus === 'rejected' ? 'pagamento_rejeitado' 
      : 'pendente';

    const { error: reservationUpdateError } = await supabase
      .from('reservations')
      .update({
        payment_status: reservationPaymentStatus,
        payment_method,
        payment_reference: mpPaymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation_id);

    if (reservationUpdateError) {
      console.error('Erro ao atualizar reservation:', reservationUpdateError);
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
      status: mpStatus,
      status_detail: mpStatusDetail,
      payment_method
    };

    // Add PIX-specific data
    if (payment_method === 'pix' && mpData?.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url
      };
      console.log('PIX QR Code gerado com sucesso');
    }

    // Add credit card specific data
    if (payment_method === 'credit_card') {
      response.card = {
        status: mpStatus,
        status_detail: mpStatusDetail,
        installments: mpData?.installments || installments
      };
    }

    console.log('=== CHECKOUT CONCLUÍDO COM SUCESSO ===');
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
