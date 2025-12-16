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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!mercadoPagoToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { paymentId, reservationId } = await req.json();

    console.log('Checking payment status:', { paymentId, reservationId });

    // Se apenas reservationId fornecido, buscar pagamento no banco primeiro
    if (!paymentId && reservationId) {
      console.log('Buscando pagamento por reservation_id:', reservationId);
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('mp_payment_id, status')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (paymentError || !paymentData) {
        console.log('Nenhum pagamento encontrado para reserva:', reservationId);
        return new Response(JSON.stringify({
          success: true,
          status: 'pending',
          message: 'Pagamento não encontrado'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Se já temos o status no banco e está approved/paid, retornar direto
      if (paymentData.status === 'paid' || paymentData.status === 'approved' || paymentData.status === 'completed') {
        console.log('Pagamento já confirmado no banco:', paymentData.status);
        return new Response(JSON.stringify({
          success: true,
          status: paymentData.status,
          mapped_status: 'completed',
          reservation_status: 'confirmed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Se temos mp_payment_id, verificar no Mercado Pago
      if (!paymentData.mp_payment_id) {
        return new Response(JSON.stringify({
          success: true,
          status: paymentData.status || 'pending'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!paymentId && !reservationId) {
      throw new Error('ID do pagamento ou da reserva é obrigatório');
    }

    // Get payment status from Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
        },
      }
    );

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      console.error('Mercado Pago error:', errorData);
      throw new Error(`Erro ao consultar pagamento: ${mpResponse.status}`);
    }

    const payment = await mpResponse.json();
    console.log('Payment status from Mercado Pago:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    });

    // Map Mercado Pago status to our status
    let paymentStatus = 'pending';
    let reservationStatus = 'pending';

    if (payment.status === 'approved') {
      paymentStatus = 'completed';
      reservationStatus = 'confirmed';
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      paymentStatus = 'failed';
      reservationStatus = 'cancelled';
    } else if (payment.status === 'in_process' || payment.status === 'pending') {
      paymentStatus = 'processing';
      reservationStatus = 'pending';
    }

    // Update payment and reservation status if reservationId provided
    if (reservationId && payment.status === 'approved') {
      console.log('Updating reservation status to confirmed...');
      
      // Update reservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (reservationError) {
        console.error('Error updating reservation:', reservationError);
      }

      // Update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_date: payment.date_approved || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('reservation_id', reservationId);

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
      }
    }

    const response = {
      success: true,
      payment_id: payment.id.toString(),
      status: payment.status,
      status_detail: payment.status_detail,
      mapped_status: paymentStatus,
      reservation_status: reservationStatus,
      date_approved: payment.date_approved,
      date_created: payment.date_created,
      transaction_amount: payment.transaction_amount,
    };

    console.log('Response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
