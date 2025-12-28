import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// IPs conhecidos do Mercado Pago (prefixos)
const MERCADO_PAGO_IP_PREFIXES = [
  '18.230.',
  '18.231.',
  '54.94.',
  '52.67.',
  '34.206.',
  '3.232.',
  '52.4.',
  '54.166.',
  '54.236.',
  '52.7.',
];

// Função para criar hash HMAC-SHA256
async function createHmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Validar assinatura do Mercado Pago
async function validateMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secretKey: string
): Promise<boolean> {
  if (!xSignature || !secretKey) {
    console.log('Assinatura ou chave secreta não fornecida');
    return false;
  }

  try {
    // Parse x-signature header (format: "ts=...,v1=...")
    const parts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        parts[key.trim()] = value.trim();
      }
    });

    const ts = parts['ts'];
    const v1 = parts['v1'];

    if (!ts || !v1) {
      console.log('Formato de assinatura inválido');
      return false;
    }

    // Construir manifest conforme documentação MP
    const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;
    
    // Gerar HMAC-SHA256
    const expectedSignature = await createHmacSha256(secretKey, manifest);
    
    // Comparar assinaturas
    const isValid = v1 === expectedSignature;
    console.log('Validação de assinatura:', isValid ? 'VÁLIDA' : 'INVÁLIDA');
    
    return isValid;
  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    return false;
  }
}

// Validar IP de origem
function validateSourceIp(ip: string | null): boolean {
  if (!ip) return false;
  return MERCADO_PAGO_IP_PREFIXES.some(prefix => ip.startsWith(prefix));
}

// Extrair IP do cliente
function getClientIp(req: Request): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('cf-connecting-ip')
    || req.headers.get('x-real-ip')
    || null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  const mercadoPagoWebhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Extrair informações de segurança
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    // Extrair headers de segurança do Mercado Pago
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    const body = await req.json();
    console.log('=== MP-WEBHOOK RECEBIDO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('X-Request-Id:', xRequestId);
    console.log('X-Signature presente:', !!xSignature);
    console.log('Client IP:', clientIp);
    console.log('Body:', JSON.stringify(body, null, 2));

    // Verificar se é um evento de pagamento
    if (!body?.data?.id) {
      console.log('Webhook sem payment ID - ignorando');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data.id;
    const action = body.action || body.type;

    // === VALIDAÇÃO DE ASSINATURA (OBRIGATÓRIA EM PRODUÇÃO) ===
    if (!mercadoPagoWebhookSecret) {
      console.error('=== CRITICAL: MERCADO_PAGO_WEBHOOK_SECRET NÃO CONFIGURADO ===');
      
      // Registrar tentativa sem secret configurado
      await supabase.from('activity_log').insert({
        user_email: 'system',
        action: 'webhook_no_secret_configured',
        description: 'Webhook recebido mas MERCADO_PAGO_WEBHOOK_SECRET não está configurado - BLOQUEADO',
        entity_type: 'security',
        metadata: {
          payment_id: paymentId,
          x_request_id: xRequestId,
          client_ip: clientIp,
          user_agent: userAgent,
          severity: 'critical'
        }
      });
      
      // Retornar 200 para não revelar que bloqueamos, mas NÃO processar
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Validar assinatura
    const isValidSignature = await validateMercadoPagoSignature(
      xSignature,
      xRequestId,
      paymentId.toString(),
      mercadoPagoWebhookSecret
    );

    // Validar IP de origem (camada adicional)
    const isValidIp = validateSourceIp(clientIp);
    
    if (!isValidSignature) {
      console.error('=== ASSINATURA INVÁLIDA - POSSÍVEL FRAUDE ===');
      
      // Registrar tentativa suspeita com detalhes completos
      await supabase.from('activity_log').insert({
        user_email: 'system',
        action: 'webhook_invalid_signature',
        description: `Tentativa de webhook com assinatura inválida - Payment ID: ${paymentId}`,
        entity_type: 'security',
        metadata: {
          payment_id: paymentId,
          x_request_id: xRequestId,
          x_signature_present: !!xSignature,
          client_ip: clientIp,
          ip_valid: isValidIp,
          user_agent: userAgent,
          action: action,
          severity: 'high',
          body_preview: JSON.stringify(body).slice(0, 500)
        }
      });
      
      // Retornar 200 para não revelar que detectamos a fraude
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Log de IP suspeito (apenas aviso, não bloqueia)
    if (!isValidIp) {
      console.warn('AVISO: Webhook recebido de IP não listado como MP:', clientIp);
      await supabase.from('activity_log').insert({
        user_email: 'system',
        action: 'webhook_unknown_ip',
        description: `Webhook válido mas de IP desconhecido: ${clientIp}`,
        entity_type: 'security',
        metadata: {
          payment_id: paymentId,
          client_ip: clientIp,
          severity: 'low'
        }
      });
    }

    // === RATE LIMITING POR PAYMENT_ID ===
    const { data: rateLimitOk } = await supabase
      .rpc('check_rate_limit', { 
        p_key: `webhook_${paymentId}`, 
        p_max_requests: 5,  // Max 5 webhooks por payment_id
        p_window_seconds: 300  // Em 5 minutos
      });

    if (!rateLimitOk) {
      console.warn('=== RATE LIMIT EXCEDIDO para payment_id:', paymentId);
      
      await supabase.from('activity_log').insert({
        user_email: 'system',
        action: 'webhook_rate_limited',
        description: `Rate limit excedido para payment_id: ${paymentId}`,
        entity_type: 'security',
        metadata: {
          payment_id: paymentId,
          client_ip: clientIp,
          severity: 'medium'
        }
      });
      
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // === VERIFICAÇÃO DE IDEMPOTÊNCIA ===
    if (xRequestId) {
      const { data: existingLog } = await supabase
        .from('payment_logs')
        .select('id')
        .eq('action', 'webhook_processed')
        .contains('response_payload', { x_request_id: xRequestId })
        .maybeSingle();

      if (existingLog) {
        console.log('Webhook já processado (idempotência) - x-request-id:', xRequestId);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
    }

    console.log('Payment ID:', paymentId);
    console.log('Action:', action);

    // === VALIDAR PAYMENT ID NA API DO MP (segunda camada de segurança) ===
    console.log('=== CONSULTANDO PAGAMENTO NO MP ===');
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`
      }
    });

    if (!mpResponse.ok) {
      console.error('Erro ao consultar pagamento ou payment ID inválido:', mpResponse.status);
      
      // Registrar tentativa com payment ID inválido
      await supabase.from('activity_log').insert({
        user_email: 'system',
        action: 'webhook_invalid_payment_id',
        description: `Webhook com payment ID não encontrado na API MP: ${paymentId}`,
        entity_type: 'security',
        metadata: {
          payment_id: paymentId,
          mp_response_status: mpResponse.status,
          client_ip: clientIp,
          severity: 'high'
        }
      });
      
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const mpData = await mpResponse.json();
    console.log('Dados do pagamento MP:', JSON.stringify(mpData, null, 2));

    const reservationId = mpData.external_reference;
    const mpStatus = mpData.status;
    const mpStatusDetail = mpData.status_detail;
    const paymentMethodType = mpData.payment_method?.type || mpData.payment_type_id;

    if (!reservationId) {
      console.log('external_reference não encontrado - ignorando');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    console.log('=== MAPEAMENTO DE STATUS ===');
    console.log('Reservation ID:', reservationId);
    console.log('MP Status:', mpStatus);
    console.log('Payment Method Type:', paymentMethodType);

    // Mapear status do MP para status interno
    let paymentStatus: string;
    let reservationStatus: string;

    switch (mpStatus) {
      case 'approved':
        paymentStatus = 'paid';
        reservationStatus = 'confirmed';
        break;
      case 'pending':
      case 'in_process':
      case 'authorized':
        paymentStatus = 'pending';
        reservationStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
        paymentStatus = 'failed';
        reservationStatus = 'cancelled';
        break;
      case 'refunded':
        paymentStatus = 'refunded';
        reservationStatus = 'cancelled';
        break;
      default:
        paymentStatus = 'pending';
        reservationStatus = 'pending';
    }

    // Normalizar payment_method
    let normalizedPaymentMethod = 'credit_card';
    if (paymentMethodType === 'pix' || paymentMethodType === 'bank_transfer') {
      normalizedPaymentMethod = 'pix';
    }

    console.log('Payment Status mapeado:', paymentStatus);
    console.log('Reservation Status mapeado:', reservationStatus);
    console.log('Payment Method normalizado:', normalizedPaymentMethod);

    // Atualizar tabela payments
    console.log('=== ATUALIZANDO PAYMENTS ===');
    const paymentUpdateData = {
      status: paymentStatus,
      status_detail: mpStatusDetail,
      mp_payment_id: paymentId.toString(),
      mercado_pago_payment_id: paymentId.toString(),
      transaction_id: paymentId.toString(),
      payment_method: normalizedPaymentMethod,
      paid_amount: mpStatus === 'approved' ? mpData.transaction_amount : null,
      updated_at: new Date().toISOString()
    };

    const { data: paymentUpdate, error: paymentError } = await supabase
      .from('payments')
      .update(paymentUpdateData)
      .eq('reservation_id', reservationId)
      .select();

    if (paymentError) {
      console.error('Erro ao atualizar payments:', paymentError);
    } else {
      console.log('Payments atualizado:', paymentUpdate?.length || 0, 'registros');
    }

    // Atualizar tabela reservations
    console.log('=== ATUALIZANDO RESERVATIONS ===');
    const reservationUpdateData = {
      payment_status: paymentStatus,
      status: reservationStatus,
      mp_transaction_id: paymentId.toString(),
      payment_reference: paymentId.toString(),
      payment_method: normalizedPaymentMethod,
      updated_at: new Date().toISOString()
    };

    const { data: reservationUpdate, error: reservationError } = await supabase
      .from('reservations')
      .update(reservationUpdateData)
      .eq('id', reservationId)
      .select();

    if (reservationError) {
      console.error('Erro ao atualizar reservations:', reservationError);
    } else {
      console.log('Reservations atualizado:', reservationUpdate?.length || 0, 'registros');
    }

    // Registrar log de processamento (para idempotência)
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      action: 'webhook_processed',
      status: mpStatus,
      response_payload: {
        x_request_id: xRequestId,
        payment_id: paymentId,
        mp_status: mpStatus,
        client_ip: clientIp,
        signature_valid: true,
        processed_at: new Date().toISOString()
      }
    });

    // Registrar log de auditoria detalhado
    await supabase.from('activity_log').insert({
      user_email: 'system',
      action: 'webhook_payment_update',
      description: `Webhook MP: Pagamento ${paymentId} - Status: ${mpStatus}`,
      entity_type: 'payment',
      entity_id: reservationId,
      metadata: {
        payment_id: paymentId,
        mp_status: mpStatus,
        mp_status_detail: mpStatusDetail,
        payment_status: paymentStatus,
        reservation_status: reservationStatus,
        payment_method: normalizedPaymentMethod,
        transaction_amount: mpData.transaction_amount,
        client_ip: clientIp,
        x_request_id: xRequestId,
        signature_validated: true
      }
    });

    // Enviar email de confirmação se pagamento aprovado (PIX)
    if (mpStatus === 'approved') {
      console.log('=== ENVIANDO EMAIL DE CONFIRMAÇÃO ===');
      
      // Buscar dados da reserva para o email
      const { data: reservationData } = await supabase
        .from('reservations')
        .select('guest_email, guest_name')
        .eq('id', reservationId)
        .single();
      
      if (reservationData?.guest_email) {
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
              email: reservationData.guest_email,
              name: reservationData.guest_name
            })
          });
          const emailResult = await emailResponse.json();
          console.log('Email enviado:', emailResult);
          
          // Registrar envio de email no log
          await supabase.from('activity_log').insert({
            user_email: 'system',
            action: 'email_confirmation_sent',
            description: `Email de confirmação enviado para ${reservationData.guest_email}`,
            entity_type: 'reservation',
            entity_id: reservationId,
            metadata: {
              email: reservationData.guest_email,
              triggered_by: 'webhook',
              payment_id: paymentId
            }
          });
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          // Registrar falha de email
          await supabase.from('activity_log').insert({
            user_email: 'system',
            action: 'email_confirmation_failed',
            description: `Falha ao enviar email de confirmação para ${reservationData.guest_email}`,
            entity_type: 'reservation',
            entity_id: reservationId,
            metadata: {
              error: String(emailError),
              payment_id: paymentId
            }
          });
        }
      }
    }

    console.log('=== MP-WEBHOOK PROCESSADO COM SUCESSO ===');

    // Sempre retornar 200 para evitar reenvios
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('=== ERRO NO MP-WEBHOOK ===');
    console.error('Error:', error);

    // Registrar erro no log de auditoria
    await supabase.from('activity_log').insert({
      user_email: 'system',
      action: 'webhook_processing_error',
      description: `Erro ao processar webhook: ${String(error)}`,
      entity_type: 'security',
      metadata: {
        error: String(error),
        client_ip: clientIp,
        user_agent: userAgent,
        severity: 'high'
      }
    });

    // Sempre retornar 200 mesmo em caso de erro
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
