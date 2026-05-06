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
  // Remove caracteres perigosos, mantém apenas letras, números, espaços e caracteres comuns
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

// Validar CPF (formato e dígitos verificadores)
function isValidCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  // Validar dígitos verificadores
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

// Validar data (formato YYYY-MM-DD)
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

// Validar telefone (aceita formatos brasileiros)
function sanitizePhone(phone: string): string {
  if (!phone) return '';
  // Remove tudo exceto números
  return phone.replace(/\D/g, '').slice(0, 15);
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
    console.log('=== CREATE-PIX-PAYMENT INICIADO ===');
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
      package_id,
      guest_language
    } = body;
    const lang = ['pt','en','es','fr','de'].includes(guest_language) ? guest_language : 'pt';

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

    // === RATE LIMITING POR EMAIL ===
    const { data: rateLimitOk } = await supabase
      .rpc('check_rate_limit', { 
        p_key: `pix_${email}`, 
        p_max_requests: 5,  // Max 5 tentativas por email
        p_window_seconds: 300  // Em 5 minutos
      });

    if (!rateLimitOk) {
      console.warn('=== RATE LIMIT EXCEDIDO para email:', email);
      
      await supabase.from('activity_log').insert({
        user_email: 'system',
        action: 'payment_rate_limited',
        description: `Rate limit excedido para criação de PIX: ${email}`,
        entity_type: 'security',
        metadata: {
          email: email,
          payment_method: 'pix',
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

    // Validar package_id se fornecido
    if (package_id && !isValidUuid(package_id)) {
      throw new Error('package_id inválido');
    }

    // Sanitizar campos opcionais
    const sanitizedPassport = sanitizeString(foreign_passport, 50);
    const sanitizedNationality = sanitizeString(foreign_nationality, 100);

    console.log('Validação de entrada concluída com sucesso');

    // Detectar modo de teste
    const isTestMode = mercadoPagoToken?.startsWith('TEST-');
    console.log('Modo de teste:', isTestMode);

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
          payment_method: 'pix',
          total_price: amount,
          status: 'pending',
          payment_status: 'pending',
          package_id: package_id || null,
          guest_language: lang
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

    // 4. Criar pagamento PIX no Mercado Pago
    console.log('=== CRIANDO PAGAMENTO PIX NO MERCADO PAGO ===');
    const idempotencyKey = crypto.randomUUID();

    const nameParts = sanitizedName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

    const payerData = {
      email: email,
      first_name: firstName.slice(0, 100),
      last_name: lastName.slice(0, 100),
      identification: {
        type: "CPF",
        number: cleanCpf
      }
    };

    const mpPayload = {
      transaction_amount: amount,
      description: `Reserva ${roomName} - Pousada Arara Azul`.slice(0, 200),
      payment_method_id: "pix",
      payer: payerData,
      external_reference: reservationId,
      notification_url: webhookUrl
    };

    console.log('MP Payments Payload (sem dados sensíveis):', {
      transaction_amount: mpPayload.transaction_amount,
      description: mpPayload.description,
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
    console.log('MP Payments Response Status:', mpResponse.status);

    if (!mpResponse.ok || mpData.error) {
      console.error('Erro Mercado Pago Payments:', mpData);
      
      await supabase
        .from('reservations')
        .update({ status: 'failed', payment_status: 'failed' })
        .eq('id', reservationId);

      await supabase.from('payment_logs').insert({
        reservation_id: reservationId,
        action: 'pix_creation_failed',
        status: 'error',
        error_code: mpData?.error || 'MP_ERROR',
        error_message: mpData?.message || mpData?.cause?.[0]?.description || 'Erro na API do Mercado Pago',
        request_payload: { ...mpPayload, payer: { email: '[REDACTED]' } },
        response_payload: mpData
      });

      throw new Error(mpData?.message || mpData?.cause?.[0]?.description || 'Erro ao criar pagamento PIX');
    }

    const pixData = {
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url
    };
    
    const mpPaymentId = mpData.id?.toString();

    console.log('Payment ID:', mpPaymentId);
    console.log('Status:', mpData.status);

    if (!pixData?.qr_code) {
      console.error('QR Code não retornado');
      throw new Error('QR Code PIX não retornado pela API');
    }

    // 5. Registrar pagamento
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
        payer_name: sanitizedName,
        payer_cpf: cleanCpf
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
        payment_qr_code: pixData.qr_code,
        payment_qr_code_base64: pixData.qr_code_base64 || '',
        payment_ticket_url: pixData.ticket_url
      })
      .eq('id', reservationId);

    // 7. Log de sucesso
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      payment_id: payment?.id,
      action: 'pix_created',
      status: 'success',
      request_payload: { amount, external_reference: reservationId },
      response_payload: { payment_id: mpPaymentId, status: mpData.status }
    });

    // 8. Resposta
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