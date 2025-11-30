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

    if (!paymentId) {
      throw new Error('ID do pagamento é obrigatório');
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
