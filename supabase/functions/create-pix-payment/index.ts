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
    console.log('=== CREATE-PIX-PAYMENT INICIADO ===');
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
      package_id
    } = body;

    // Validações
    if (!bungalow_id || !checkin || !checkout || !email) {
      throw new Error('Campos obrigatórios: bungalow_id, checkin, checkout, email');
    }

    const rawAmount = parseFloat(total_amount);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      throw new Error('total_amount deve ser um número válido maior que zero');
    }
    // Arredondar para 2 casas decimais (Mercado Pago requer precisão exata)
    const amount = Math.round(rawAmount * 100) / 100;

    const cleanCpf = cpf?.replace(/\D/g, '') || '';
    if (!cleanCpf || cleanCpf.length !== 11) {
      throw new Error('CPF é obrigatório para pagamento PIX');
    }

    // Detectar modo de teste (token começa com TEST-)
    const isTestMode = mercadoPagoToken?.startsWith('TEST-');
    console.log('Modo de teste:', isTestMode);
    console.log('Usando API de Payments (produção)');

    // 1. Buscar nome do bangalô
    console.log('=== BUSCANDO NOME DO BANGALÔ ===');
    const { data: roomData } = await supabase
      .from('rooms')
      .select('name_pt')
      .eq('id', bungalow_id)
      .single();
    
    const roomName = roomData?.name_pt || 'Bangalô';
    console.log('Room name:', roomName);

    // 2. Verificar reserva existente
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
      // 3. Criar pré-reserva
      console.log('=== CRIANDO PRÉ-RESERVA ===');
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          room_id: bungalow_id,
          room_name: roomName,
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
          payment_method: 'pix',
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

    // 3. Criar pagamento PIX no Mercado Pago usando API de Payments (mais estável)
    console.log('=== CRIANDO PAGAMENTO PIX NO MERCADO PAGO (Payments API) ===');
    const idempotencyKey = crypto.randomUUID();

    // Extrair primeiro e último nome
    const nameParts = (full_name || 'Cliente').trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

    // Em produção, usar dados reais do cliente
    const payerData = {
      email: email,
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: "CPF",
        number: cleanCpf
      }
    };

    console.log('Payer data:', JSON.stringify(payerData, null, 2));

    // Payload para API de Payments (formato oficial do Mercado Pago)
    const mpPayload = {
      transaction_amount: amount,
      description: `Reserva ${roomName} - Pousada Arara Azul`,
      payment_method_id: "pix",
      payer: payerData,
      external_reference: reservationId,
      notification_url: webhookUrl
    };

    console.log('MP Payments Payload:', JSON.stringify(mpPayload, null, 2));

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
    console.log('MP Payments Response Status:', mpResponse.status);
    console.log('MP Payments Response:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok || mpData.error) {
      console.error('Erro Mercado Pago Payments:', mpData);
      
      await supabase
        .from('reservations')
        .update({ status: 'failed', payment_status: 'failed' })
        .eq('id', reservationId);

      // Log de erro
      await supabase.from('payment_logs').insert({
        reservation_id: reservationId,
        action: 'pix_creation_failed',
        status: 'error',
        error_code: mpData?.error || 'MP_ERROR',
        error_message: mpData?.message || mpData?.cause?.[0]?.description || 'Erro na API do Mercado Pago',
        request_payload: mpPayload,
        response_payload: mpData
      });

      throw new Error(mpData?.message || mpData?.cause?.[0]?.description || 'Erro ao criar pagamento PIX');
    }

    // Extrair dados PIX da resposta da API de Payments
    const pixData = {
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url
    };
    
    const mpPaymentId = mpData.id?.toString();

    console.log('Payment ID:', mpPaymentId);
    console.log('Status:', mpData.status);
    console.log('PIX Data:', JSON.stringify(pixData, null, 2));

    if (!pixData?.qr_code) {
      console.error('QR Code não retornado. Response completo:', mpData);
      throw new Error('QR Code PIX não retornado pela API');
    }

    // 4. Registrar pagamento na tabela payments
    console.log('=== REGISTRANDO PAGAMENTO PIX ===');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        reservation_id: reservationId,
        mercado_pago_payment_id: mpPaymentId,
        mp_payment_id: mpPaymentId,
        transaction_id: mpPaymentId,
        payment_method: 'pix',
        status: mpData.status || 'pending',
        status_detail: mpData.status_detail,
        amount: amount,
        total_amount: amount,
        payer_email: email,
        payer_name: full_name,
        payer_cpf: cleanCpf
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
        payment_qr_code: pixData.qr_code,
        payment_qr_code_base64: pixData.qr_code_base64 || '',
        payment_ticket_url: pixData.ticket_url
      })
      .eq('id', reservationId);

    // 6. Log de sucesso
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      payment_id: payment?.id,
      action: 'pix_created',
      status: 'success',
      request_payload: mpPayload,
      response_payload: mpData
    });

    // 7. Resposta
    const response = {
      success: true,
      reservation_id: reservationId,
      payment_id: payment?.id || mpPaymentId,
      mp_payment_id: mpPaymentId,
      status: mpData.status,
      status_detail: mpData.status_detail,
      pix: {
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64 || '',
        ticket_url: pixData.ticket_url
      }
    };

    console.log('=== CREATE-PIX-PAYMENT CONCLUÍDO ===');
    console.log('Response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('=== ERRO CREATE-PIX-PAYMENT ===');
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
