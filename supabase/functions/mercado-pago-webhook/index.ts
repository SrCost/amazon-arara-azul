import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

  try {
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET requests (user redirect after payment)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const paymentId = url.searchParams.get('payment_id');
      const status = url.searchParams.get('status');
      const externalReference = url.searchParams.get('external_reference');

      console.log('Mercado Pago redirect:', { paymentId, status, externalReference });

      // Redirect to success page
      const redirectUrl = new URL(`${url.origin}/reserva-confirmada`);
      if (externalReference) {
        redirectUrl.searchParams.set('reservationId', externalReference);
      }
      redirectUrl.searchParams.set('status', status || 'pending');

      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Handle POST requests (webhook notifications)
    const body = await req.json();
    console.log('Mercado Pago webhook received:', body);

    // Mercado Pago sends notifications for different events
    if (body.type === 'payment') {
      const paymentId = body.data.id;

      // Get payment details from Mercado Pago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${mercadoPagoToken}`,
          },
        }
      );

      if (!mpResponse.ok) {
        throw new Error(`Failed to fetch payment details: ${mpResponse.status}`);
      }

      const payment = await mpResponse.json();
      console.log('Payment details:', {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference,
      });

      // Map Mercado Pago status to our payment status
      let paymentStatus = 'pending';
      if (payment.status === 'approved') {
        paymentStatus = 'completed';
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        paymentStatus = 'failed';
      }

      // Update payment in database
      if (payment.external_reference) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('reservation_id', payment.external_reference);

        if (updateError) {
          console.error('Error updating payment:', updateError);
          throw updateError;
        }

        console.log('Payment updated successfully:', {
          reservation_id: payment.external_reference,
          status: paymentStatus,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
