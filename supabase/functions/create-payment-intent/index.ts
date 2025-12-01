import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do servidor incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      reservationId,
      reservationData,
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

    // Find or create reservation
    if (reservationData && !reservationId) {
      console.log('Checking for existing reservation...');
      
      const { data: existingReservation, error: findError } = await supabase
        .from('reservations')
        .select('id, payment_status, payment_intent_id')
        .eq('room_id', reservationData.room_id)
        .eq('check_in', reservationData.check_in)
        .eq('check_out', reservationData.check_out)
        .eq('guest_email', reservationData.guest_email)
        .maybeSingle();

      if (findError) {
        console.error('Error checking existing reservation:', findError);
      }

      if (existingReservation) {
        console.log('Found existing reservation:', existingReservation.id);
        currentReservationId = existingReservation.id;
        
        if (existingReservation.payment_status === 'paid' || existingReservation.payment_status === 'approved') {
          throw new Error('Esta reserva já foi paga. Por favor, entre em contato com o suporte.');
        }
        
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            guest_name: reservationData.guest_name,
            guest_phone: reservationData.guest_phone || null,
            guests: reservationData.guests,
            total_price: reservationData.total_price,
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
          .eq('id', currentReservationId);

        if (updateError) {
          console.error('Error updating existing reservation:', updateError);
        }
      } else {
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

        // Create payment record with new fields
        const { error: paymentInsertError } = await supabase.from('payments').insert({
          reservation_id: currentReservationId,
          amount: amount || reservationData.total_price,
          payment_method: paymentMethod,
          method: paymentMethod, // New field
          status: 'pending',
          payer_name: payerName,
          payer_email: payerEmail,
          payer_cpf: payerCpf,
        });

        if (paymentInsertError) {
          console.error('Error creating payment record:', paymentInsertError);
        }
      }
    }

    if (!currentReservationId) {
      throw new Error('ID da reserva é obrigatório');
    }

    console.log('Processing payment for reservation:', currentReservationId);

    const idempotencyKey = crypto.randomUUID();
    const transactionAmount = parseFloat(amount);

    // Split name into first and last name
    const nameParts = (payerName || '').trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    let paymentPayload: any = {
      transaction_amount: transactionAmount,
      description,
      external_reference: currentReservationId,
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

    // Create payment with Mercado Pago Payments API
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentPayload)
    });

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response status:', mpResponse.status);
    console.log('Mercado Pago response:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
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

    const mpPaymentId = mpData.id?.toString();
    const mpStatus = mpData.status;

    // Map status to valid payment_status values
    const mapMpStatusToPaymentStatus = (status: string): string => {
      switch (status) {
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
          return 'refunded';
        default:
          return 'pending';
      }
    };

    const paymentStatus = mapMpStatusToPaymentStatus(mpStatus);
    const reservationStatus = paymentStatus === 'paid' ? 'confirmed' : 'pending';

    // Update reservation with payment data
    const reservationUpdate: any = {
      payment_intent_id: mpPaymentId,
      payment_reference: mpPaymentId, // New field
      payer_name: payerName,
      payer_email: payerEmail,
      payer_cpf: payerCpf,
      transaction_amount: mpData.transaction_amount,
      transaction_currency: 'BRL',
      payment_status: paymentStatus,
      status: reservationStatus
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
    }

    // Update payment record with new fields including transaction_id
    console.log('Updating payment record...');
    console.log('Saving transaction_id:', mpPaymentId);

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        mercado_pago_payment_id: mpPaymentId,
        transaction_id: mpPaymentId, // Save as transaction_id 
        status: mpStatus,
        status_detail: mpData.status_detail || null,
        payment_method: paymentMethod, // Correct field name
        method: paymentMethod,
        payment_date: mpData.date_approved || mpData.date_created || null,
        payer_name: payerName,
        payer_email: payerEmail,
        payer_cpf: payerCpf,
        installments: mpData.installments || 1,
        total_amount: transactionAmount,
        paid_amount: mpStatus === 'approved' ? transactionAmount : null
      })
      .eq('reservation_id', currentReservationId);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
    }

    // Log success
    await supabase.from('payment_logs').insert({
      reservation_id: currentReservationId,
      action: 'create_payment',
      status: 'success',
      request_payload: paymentPayload,
      response_payload: mpData
    });

    // Build response
    const response: any = {
      success: true,
      reservation_id: currentReservationId,
      payment_id: mpPaymentId,
      status: mpStatus,
      payment_status: paymentStatus,
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
        status: mpStatus,
        status_detail: mpData.status_detail,
        external_reference: mpData.external_reference
      };
    }

    console.log('Payment created successfully');
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
