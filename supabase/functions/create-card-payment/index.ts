import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// === FUNÇÕES DE VALIDAÇÃO ===

// Validar e sanitizar string
function sanitizeString(value: unknown, maxLength: number = 255): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"`;]/g, '');
}

// Validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validar CPF
function isValidCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf[10])) return false;
  
  return true;
}

// Validar UUID
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validar data
function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Verificar se data não está no passado
function isNotPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// Sanitizar telefone
function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(0, 15);
}

// Validar bandeira de cartão
function isValidCardBrand(brand: string): boolean {
  const validBrands = ['visa', 'master', 'mastercard', 'amex', 'elo', 'hipercard', 'diners'];
  return validBrands.includes(brand?.toLowerCase());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Extrair IP do cliente para logs
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  try {
    const body = await req.json();
    console.log('=== CREATE-CARD-PAYMENT INICIADO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Client IP:', clientIp);

    // === VALIDAÇÃO DE ENTRADA ===
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

    // Validar campos obrigatórios
    if (!bungalow_id || !isValidUuid(bungalow_id)) {
      throw new Error('bungalow_id inválido ou não fornecido');
    }

    if (!checkin || !isValidDate(checkin)) {
      throw new Error('Data de check-in inválida');
    }

    if (!checkout || !isValidDate(checkout)) {
      throw new Error('Data de check-out inválida');
    }

    if (!isNotPastDate(checkin)) {
      throw new Error('Data de check-in não pode ser no passado');
    }

    if (new Date(checkout) <= new Date(checkin)) {
      throw new Error('Data de check-out deve ser posterior ao check-in');
    }

    if (!email || !isValidEmail(email)) {
      throw new Error('Email inválido');
    }

    if (!card_token || typeof card_token !== 'string' || card_token.length < 10) {
      throw new Error('Token do cartão inválido');
    }

    // === RATE LIMITING POR EMAIL ===
    const { data: rateLimitOk } = await supabase
      .rpc('check_rate_limit', { 
        p_key: `card_${email}`, 
        p_max_requests: 5,  // Max 5 tentativas por email
        p_window_seconds: 300  // Em 5 minutos
      });

    if (!rateLimitOk) {
      console.warn('=== RATE LIMIT EXCEDIDO para email:', email);
      
      await supabase.from('activity_log').insert({
        user_email: 'system',
        action: 'payment_rate_limited',
        description: `Rate limit excedido para pagamento com cartão: ${email}`,
        entity_type: 'security',
        metadata: {
          email: email,
          payment_method: 'credit_card',
          client_ip: clientIp,
          severity: 'medium'
        }
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'rate_limit_exceeded',
        message: 'Muitas tentativas de pagamento. Aguarde alguns minutos.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429
      });
    }

    // Sanitizar strings
    const sanitizedName = sanitizeString(full_name, 200);
    if (!sanitizedName || sanitizedName.length < 2) {
      throw new Error('Nome completo inválido');
    }

    const sanitizedPhone = sanitizePhone(phone);

    // Validar CPF
    const cleanCpf = cpf?.replace(/\D/g, '') || '';
    if (!cleanCpf || !isValidCpf(cleanCpf)) {
      throw new Error('CPF inválido');
    }

    // Validar guests
    const validGuests = Math.min(Math.max(parseInt(String(guests)) || 1, 1), 10);

    // Validar amount
    const rawAmount = parseFloat(total_amount);
    if (isNaN(rawAmount) || rawAmount <= 0 || rawAmount > 1000000) {
      throw new Error('Valor total inválido');
    }
    let amount = Math.round(rawAmount * 100) / 100;
    
    const MIN_AMOUNT = 0.50;
    if (amount < MIN_AMOUNT) {
      console.log(`Valor ${amount} abaixo do mínimo. Ajustando para ${MIN_AMOUNT}`);
      amount = MIN_AMOUNT;
    }

    // Validar installments
    const validInstallments = Math.min(Math.max(parseInt(String(installments)) || 1, 1), 12);

    // Validar card_brand
    const validCardBrand = card_brand && isValidCardBrand(card_brand) ? card_brand.toLowerCase() : 'master';

    // Validar package_id se fornecido
    if (package_id && !isValidUuid(package_id)) {
      throw new Error('package_id inválido');
    }

    // Sanitizar campos opcionais
    const sanitizedPassport = sanitizeString(foreign_passport, 50);
    const sanitizedNationality = sanitizeString(foreign_nationality, 100);

    console.log('Validação de entrada concluída com sucesso');

    // 1. Buscar nome do bangalô
    console.log('=== BUSCANDO NOME DO BANGALÔ ===');
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('name_pt')
      .eq('id', bungalow_id)
      .single();
    
    if (roomError || !roomData) {
      throw new Error('Bangalô não encontrado');
    }
    
    const roomName = roomData.name_pt;
    console.log('Room name:', roomName);

    // 2. VALIDAR DISPONIBILIDADE DAS DATAS
    console.log('=== VERIFICANDO DISPONIBILIDADE DAS DATAS ===');
    const { data: conflictingReservations, error: conflictError } = await supabase
      .from('reservations')
      .select('id, check_in, check_out, guest_name, status')
      .eq('room_id', bungalow_id)
      .in('status', ['pending', 'confirmed'])
      .neq('guest_email', email)
      .or(`and(check_in.lte.${checkin},check_out.gt.${checkin}),and(check_in.lt.${checkout},check_out.gte.${checkout}),and(check_in.gte.${checkin},check_out.lte.${checkout})`);

    if (conflictError) {
      console.error('Erro ao verificar conflitos:', conflictError);
    }

    if (conflictingReservations && conflictingReservations.length > 0) {
      console.error('Datas conflitantes encontradas:', conflictingReservations);
      return new Response(JSON.stringify({
        success: false,
        error: 'dates_unavailable',
        message: 'As datas selecionadas já estão reservadas. Por favor, escolha outras datas.',
        conflicting_dates: conflictingReservations.map(r => ({
          check_in: r.check_in,
          check_out: r.check_out
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409
      });
    }
    console.log('Datas disponíveis - nenhum conflito encontrado');

    // 3. Verificar reserva existente
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
          guests: validGuests,
          guest_name: sanitizedName,
          guest_email: email,
          guest_phone: sanitizedPhone,
          cpf: cleanCpf,
          payer_cpf: cleanCpf,
          payer_email: email,
          payer_name: sanitizedName,
          birth_date: date_of_birth && isValidDate(date_of_birth) ? date_of_birth : null,
          is_foreign: is_foreign || false,
          passport: sanitizedPassport || null,
          nationality: sanitizedNationality || null,
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

    // 4. Criar pagamento com cartão no Mercado Pago
    console.log('=== CRIANDO PAGAMENTO CARTÃO NO MERCADO PAGO ===');
    const idempotencyKey = crypto.randomUUID();

    const nameParts = sanitizedName.trim().split(' ');
    const firstName = nameParts[0].slice(0, 100);
    const lastName = (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Pousada').slice(0, 100);

    const mpPayload = {
      transaction_amount: amount,
      token: card_token,
      installments: validInstallments,
      payment_method_id: validCardBrand,
      external_reference: reservationId,
      description: `Reserva Pousada Arara Azul - ${sanitizedName}`.slice(0, 200),
      notification_url: webhookUrl,
      payer: {
        email: email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: cleanCpf
        }
      }
    };

    console.log('MP Card Payload (sem dados sensíveis):', {
      transaction_amount: mpPayload.transaction_amount,
      installments: mpPayload.installments,
      external_reference: mpPayload.external_reference
    });

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

    if (!mpResponse.ok) {
      console.error('Erro Mercado Pago Card:', mpData);
      
      await supabase
        .from('reservations')
        .update({ status: 'failed', payment_status: 'failed' })
        .eq('id', reservationId);

      await supabase.from('payment_logs').insert({
        reservation_id: reservationId,
        action: 'card_payment_failed',
        status: 'error',
        error_code: mpData?.error || 'MP_ERROR',
        error_message: mpData?.message || mpData?.cause?.[0]?.description || 'Erro na API do Mercado Pago',
        request_payload: { amount, installments: validInstallments, external_reference: reservationId },
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

    // 5. Registrar pagamento
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
        payer_name: sanitizedName,
        payer_cpf: cleanCpf,
        installments: validInstallments
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Erro ao registrar pagamento:', paymentError);
    }

    // 6. Atualizar reserva
    await supabase
      .from('reservations')
      .update({
        mp_transaction_id: mpPaymentId,
        payment_reference: mpPaymentId,
        status: reservationStatus,
        payment_status: paymentStatus
      })
      .eq('id', reservationId);

    // 7. Log de resultado
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      payment_id: payment?.id,
      action: `card_payment_${mpStatus}`,
      status: mpStatus,
      request_payload: { amount, installments: validInstallments, external_reference: reservationId },
      response_payload: { payment_id: mpPaymentId, status: mpStatus }
    });

    // 8. Enviar email de confirmação se aprovado imediatamente
    if (mpStatus === 'approved') {
      console.log('=== ENVIANDO EMAIL DE CONFIRMAÇÃO (CARTÃO) ===');
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-reservation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            type: 'reservation_confirmed',
            reservationId: reservationId,
            email: email,
            name: sanitizedName
          })
        });
        const emailResult = await emailResponse.json();
        console.log('Email de confirmação enviado:', emailResult);
        
        // Send internal admin notification
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-internal-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({
              type: 'new_reservation',
              data: { guest_name: sanitizedName, check_in: checkIn, check_out: checkOut, guests, total_price: totalPrice, payment_method: 'credit_card', reservation_source: 'site' },
            }),
          });
        } catch (notifErr) { console.error('Internal notification error:', notifErr); }

        await supabase.from('activity_log').insert({
          user_email: 'system',
          action: 'email_confirmation_sent',
          description: `Email de confirmação enviado para ${email}`,
          entity_type: 'reservation',
          entity_id: reservationId
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
    }

    // 9. Resposta
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

    if (mpStatus === 'rejected') {
      response.success = false;
      response.error_message = getCardErrorMessage(mpStatusDetail);
    }

    console.log('=== CREATE-CARD-PAYMENT CONCLUÍDO ===');

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