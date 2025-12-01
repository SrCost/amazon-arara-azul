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
    console.log('=== CREATE-ORDER-MP INICIADO ===');
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
      payment_method,
      total_amount,
      card_token,
      card_brand,
      installments = 1
    } = body;

    // Validações
    if (!bungalow_id || !checkin || !checkout || !email) {
      throw new Error('Campos obrigatórios: bungalow_id, checkin, checkout, email');
    }

    const amount = parseFloat(total_amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('total_amount deve ser um número válido maior que zero');
    }

    const cleanCpf = cpf?.replace(/\D/g, '') || '';
    if (cleanCpf && cleanCpf.length !== 11) {
      throw new Error('CPF inválido');
    }

    // 1. Criar pré-reserva
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
        cpf: cleanCpf || null,
        birth_date: date_of_birth || null,
        is_foreign: is_foreign || false,
        passport: foreign_passport || null,
        nationality: foreign_nationality || null,
        payment_method: payment_method,
        total_price: amount,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Erro ao criar reserva:', reservationError);
      throw new Error('Falha ao criar pré-reserva: ' + reservationError.message);
    }

    console.log('Reserva criada:', reservation.id);

    // 2. Criar pagamento no Mercado Pago (usando Payments API)
    console.log('=== CRIANDO PAGAMENTO MERCADO PAGO ===');
    const idempotencyKey = crypto.randomUUID();

    let mpPayload: any;
    
    if (payment_method === 'pix') {
      // PIX Payment
      mpPayload = {
        transaction_amount: amount,
        payment_method_id: 'pix',
        external_reference: reservation.id,
        description: 'Reserva - Pousada Arara Azul',
        payer: {
          email: email,
          first_name: full_name?.split(' ')[0] || 'Cliente',
          last_name: full_name?.split(' ').slice(1).join(' ') || 'Pousada',
          identification: cleanCpf ? {
            type: 'CPF',
            number: cleanCpf
          } : undefined
        }
      };
    } else {
      // Credit Card Payment
      if (!card_token) {
        throw new Error('card_token é obrigatório para pagamento com cartão');
      }
      
      mpPayload = {
        transaction_amount: amount,
        token: card_token,
        installments: parseInt(String(installments)),
        payment_method_id: card_brand || 'master',
        external_reference: reservation.id,
        description: 'Reserva - Pousada Arara Azul',
        payer: {
          email: email,
          first_name: full_name?.split(' ')[0] || 'Cliente',
          last_name: full_name?.split(' ').slice(1).join(' ') || 'Pousada',
          identification: cleanCpf ? {
            type: 'CPF',
            number: cleanCpf
          } : undefined
        }
      };
    }

    console.log('MP Payload:', JSON.stringify(mpPayload, null, 2));

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
    console.log('MP Response:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      console.error('Erro Mercado Pago:', mpData);
      
      // Atualizar reserva com erro
      await supabase
        .from('reservations')
        .update({ status: 'failed', payment_status: 'failed' })
        .eq('id', reservation.id);

      throw new Error(mpData?.message || mpData?.cause?.[0]?.description || 'Erro na API do Mercado Pago');
    }

    const mpPaymentId = mpData.id?.toString();
    const mpStatus = mpData.status;

    // 3. Registrar pagamento
    console.log('=== REGISTRANDO PAGAMENTO ===');
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        reservation_id: reservation.id,
        mercado_pago_payment_id: mpPaymentId,
        mp_payment_id: mpPaymentId,
        transaction_id: mpPaymentId,
        payment_method: payment_method === 'pix' ? 'pix' : 'credit_card',
        status: mpStatus === 'approved' ? 'paid' : 'pending',
        amount: amount,
        payer_email: email,
        payer_cpf: cleanCpf || null
      });

    if (paymentError) {
      console.error('Erro ao registrar pagamento:', paymentError);
    }

    // 4. Atualizar reserva com dados do pagamento
    const updateData: any = {
      mp_transaction_id: mpPaymentId,
      payment_reference: mpPaymentId
    };

    if (mpStatus === 'approved') {
      updateData.status = 'confirmed';
      updateData.payment_status = 'paid';
    }

    await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservation.id);

    // 5. Preparar resposta
    const response: any = {
      success: true,
      reservation_id: reservation.id,
      payment_id: mpPaymentId,
      status: mpStatus,
      payment_method: payment_method
    };

    // Dados PIX
    if (payment_method === 'pix' && mpData.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url
      };
      console.log('PIX QR Code gerado com sucesso');
    }

    // Dados Cartão
    if (payment_method !== 'pix') {
      response.card = {
        status: mpStatus,
        status_detail: mpData.status_detail
      };
    }

    console.log('=== CREATE-ORDER-MP CONCLUÍDO ===');
    console.log('Response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('=== ERRO CREATE-ORDER-MP ===');
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
