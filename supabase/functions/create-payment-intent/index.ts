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
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials não configuradas');
      throw new Error('Configuração do servidor incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      // Existing reservation ID (for existing reservations)
      reservationId,
      // Reservation data (for creating new reservations)
      reservationData,
      // Payment data
      paymentMethod,
      amount,
      payerName,
      payerEmail,
      payerCpf,
      cardToken,
      installments = 1,
      paymentMethodId,
      description = 'Reserva Bangalô - Pousada Arara Azul'
    } = body;

    let currentReservationId = reservationId;

    // If reservationData is provided, create a new reservation
    if (reservationData && !reservationId) {
      console.log('Creating new reservation...');
      
      const { data: newReservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          room_id: reservationData.room_id,
          room_name: reservationData.room_name,
          package_id: reservationData.package_id || null,
          user_id: reservationData.user_id || null,
          guest_name: reservationData.guest_name,
          guest_email: reservationData.guest_email,
          guest_phone: reservationData.guest_phone || null,
          check_in: reservationData.check_in,
          check_out: reservationData.check_out,
          guests: reservationData.guests,
          total_price: reservationData.total_price,
          status: 'pending',
          payment_status: 'pending',
          payment_method: paymentMethod,
          special_requests: reservationData.special_requests || null,
          is_foreign: reservationData.is_foreign || false,
          cpf: reservationData.cpf || null,
          birth_date: reservationData.birth_date || null,
          country: reservationData.country || null,
          nationality: reservationData.nationality || null,
          passport: reservationData.passport || null,
          address: reservationData.address || null,
          next_destination: reservationData.next_destination || null,
          dietary_restrictions: reservationData.dietary_restrictions || null,
          emergency_contact: reservationData.emergency_contact || null,
          payer_name: payerName,
          payer_email: payerEmail,
          payer_cpf: payerCpf,
        })
        .select()
        .single();

      if (reservationError) {
        console.error('Error creating reservation:', reservationError);
        throw new Error(`Erro ao criar reserva: ${reservationError.message}`);
      }

      currentReservationId = newReservation.id;
      console.log('Reservation created:', currentReservationId);

      // Create payment record
      const { error: paymentInsertError } = await supabase.from('payments').insert({
        reservation_id: currentReservationId,
        amount: amount || reservationData.total_price,
        payment_method: paymentMethod,
        status: 'pending',
        payer_name: payerName,
        payer_email: payerEmail,
        payer_cpf: payerCpf,
      });

      if (paymentInsertError) {
        console.error('Error creating payment record:', paymentInsertError);
        // Don't fail the whole operation, just log
      }
    }

    if (!currentReservationId) {
      throw new Error('ID da reserva é obrigatório');
    }

    console.log('Processing payment for reservation:', currentReservationId);

    // Split name into first and last name
    const nameParts = (payerName || '').trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    let paymentPayload: any = {
      transaction_amount: parseFloat(amount),
      description,
      external_reference: currentReservationId, // Used by webhook to identify reservation
      payer: {
        email: payerEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: (payerCpf || '').replace(/\D/g, '')
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
    console.log('Payment payload:', JSON.stringify(paymentPayload, null, 2));

    // Create payment with Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${currentReservationId}-${Date.now()}`
      },
      body: JSON.stringify(paymentPayload)
    });

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response status:', mpResponse.status);
    console.log('Mercado Pago response:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      // Log error to payment_logs
      await supabase.from('payment_logs').insert({
        reservation_id: currentReservationId,
        action: 'create_payment',
        status: 'error',
        error_code: mpData.status?.toString() || mpData.error || 'UNKNOWN',
        error_message: mpData.message || mpData.cause?.[0]?.description || JSON.stringify(mpData),
        request_payload: paymentPayload,
        response_payload: mpData
      });

      const errorMessage = mpData.message || mpData.cause?.[0]?.description || 'Erro ao criar pagamento no Mercado Pago';
      throw new Error(errorMessage);
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

    console.log('Updating reservation:', currentReservationId);

    const { error: reservationError } = await supabase
      .from('reservations')
      .update(reservationUpdate)
      .eq('id', currentReservationId);

    if (reservationError) {
      console.error('Error updating reservation:', reservationError);
      // Don't throw, payment was successful
    }

    // Update payment record
    console.log('Updating payment record...');

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        mercado_pago_payment_id: mpData.id.toString(),
        status: mpData.status,
        payment_date: mpData.date_approved || null,
        payer_name: payerName,
        payer_email: payerEmail,
        payer_cpf: payerCpf,
        installments: mpData.installments || 1
      })
      .eq('reservation_id', currentReservationId);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
      // Don't throw, payment was successful
    }

    // Log success
    await supabase.from('payment_logs').insert({
      reservation_id: currentReservationId,
      action: 'create_payment',
      status: 'success',
      request_payload: paymentPayload,
      response_payload: mpData
    });

    // Return response
    const response: any = {
      success: true,
      reservation_id: currentReservationId,
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
    console.log('Response:', JSON.stringify(response, null, 2));

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
