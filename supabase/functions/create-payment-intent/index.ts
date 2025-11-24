import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!mercadoPagoToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const {
      reservationId,
      paymentMethod,
      amount,
      payerName,
      payerEmail,
      payerCpf,
      cardToken,
      installments = 1,
      paymentMethodId,
      description = 'Reserva Bangalô - Pousada Arara Azul'
    } = await req.json();

    console.log('Creating payment intent:', { 
      reservationId, 
      paymentMethod, 
      amount,
      payerEmail 
    });

    // Split name into first and last name
    const nameParts = payerName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    let paymentPayload: any = {
      transaction_amount: parseFloat(amount),
      description,
      payer: {
        email: payerEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: payerCpf.replace(/\D/g, '')
        }
      }
    };

    // Configure payment based on method
    if (paymentMethod === 'pix') {
      paymentPayload.payment_method_id = 'pix';
    } else if (paymentMethod === 'credit_card') {
      if (!cardToken || !paymentMethodId) {
        throw new Error('Token do cartão e método de pagamento são obrigatórios');
      }
      paymentPayload.token = cardToken;
      paymentPayload.installments = parseInt(installments);
      paymentPayload.payment_method_id = paymentMethodId;
    } else {
      throw new Error('Método de pagamento inválido');
    }

    console.log('Sending request to Mercado Pago...');

    // Create payment with Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': reservationId
      },
      body: JSON.stringify(paymentPayload)
    });

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response:', mpData);

    if (!mpResponse.ok) {
      // Log error to payment_logs
      await supabase.from('payment_logs').insert({
        reservation_id: reservationId,
        action: 'create_payment',
        status: 'error',
        error_code: mpData.status || 'UNKNOWN',
        error_message: mpData.message || JSON.stringify(mpData),
        request_payload: paymentPayload,
        response_payload: mpData
      });

      throw new Error(mpData.message || 'Erro ao criar pagamento no Mercado Pago');
    }

    // Extract payment data
    const paymentData = {
      mercado_pago_payment_id: mpData.id.toString(),
      status: mpData.status,
      method: paymentMethod,
      amount: mpData.transaction_amount,
      installments: mpData.installments || 1,
      payer_name: payerName,
      payer_email: payerEmail,
      payer_cpf: payerCpf
    };

    // Update reservation with payment intent data
    const reservationUpdate: any = {
      payment_intent_id: mpData.id.toString(),
      payer_name: payerName,
      payer_email: payerEmail,
      payer_cpf: payerCpf,
      transaction_amount: mpData.transaction_amount,
      transaction_currency: 'BRL',
      payment_status: mpData.status === 'approved' ? 'paid' : 'processing'
    };

    // Add PIX-specific data
    if (paymentMethod === 'pix' && mpData.point_of_interaction?.transaction_data) {
      reservationUpdate.payment_qr_code = mpData.point_of_interaction.transaction_data.qr_code;
      reservationUpdate.payment_qr_code_base64 = mpData.point_of_interaction.transaction_data.qr_code_base64;
      reservationUpdate.payment_ticket_url = mpData.point_of_interaction.transaction_data.ticket_url;
    }

    console.log('Updating reservation:', reservationId);

    const { error: reservationError } = await supabase
      .from('reservations')
      .update(reservationUpdate)
      .eq('id', reservationId);

    if (reservationError) {
      console.error('Error updating reservation:', reservationError);
      throw reservationError;
    }

    // Update payment record
    console.log('Updating payment record...');

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        ...paymentData,
        status: mpData.status,
        payment_date: mpData.date_approved || null
      })
      .eq('reservation_id', reservationId);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
      throw paymentError;
    }

    // Log success
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      action: 'create_payment',
      status: 'success',
      request_payload: paymentPayload,
      response_payload: mpData
    });

    // Return response
    const response: any = {
      success: true,
      payment_id: mpData.id.toString(),
      status: mpData.status,
      payment_method: paymentMethod
    };

    if (paymentMethod === 'pix' && mpData.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url
      };
    }

    if (paymentMethod === 'credit_card') {
      response.card = {
        status: mpData.status,
        status_detail: mpData.status_detail,
        external_reference: mpData.external_reference
      };
    }

    console.log('Payment intent created successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-payment-intent:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
    const errorName = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
    
    return new Response(JSON.stringify({
      success: false,
      error_code: errorName,
      error_message: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});