import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to send emails
async function sendEmail(supabaseUrl: string, supabaseKey: string, emailData: any) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-reservation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(emailData),
    });
    
    if (!response.ok) {
      console.error('Error sending email:', await response.text());
    } else {
      console.log('Email sent successfully');
    }
  } catch (error) {
    console.error('Error calling email function:', error);
  }
}

// Map Mercado Pago status to valid payment_status values
function mapMpStatusToPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
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
}

// Map payment status to reservation status
function mapToReservationStatus(paymentStatus: string): string {
  switch (paymentStatus) {
    case 'paid':
      return 'confirmed';
    case 'failed':
      return 'cancelled';
    default:
      return 'pending';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET requests (user redirect after payment)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const paymentId = url.searchParams.get('payment_id');
      const status = url.searchParams.get('status');
      const externalReference = url.searchParams.get('external_reference');

      console.log('Mercado Pago redirect:', { paymentId, status, externalReference });

      const redirectUrl = new URL(`${url.origin}/reserva-confirmada`);
      if (externalReference) {
        redirectUrl.searchParams.set('reservationId', externalReference);
      }
      redirectUrl.searchParams.set('status', status || 'pending');

      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Handle POST requests (webhook notifications)
    const body = await req.json();
    console.log('Mercado Pago webhook received:', JSON.stringify(body, null, 2));

    // Only process payment notifications
    if (body.type !== 'payment') {
      console.log(`Notification type ${body.type} not handled, ignoring`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const paymentId = body.data?.id;

    if (!paymentId) {
      console.log('No payment ID in webhook, ignoring');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fetch payment details from Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
        },
      }
    );

    if (!mpResponse.ok) {
      console.error(`Failed to fetch payment details: ${mpResponse.status}`);
      throw new Error(`Failed to fetch payment details: ${mpResponse.status}`);
    }

    const payment = await mpResponse.json();
    console.log('Payment details:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
    });

    const reservationId = payment.external_reference;

    if (!reservationId) {
      console.log('No external reference found, ignoring');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const paymentStatus = mapMpStatusToPaymentStatus(payment.status);
    const reservationStatus = mapToReservationStatus(paymentStatus);

    // Get reservation details for email
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    // Update payment record with new fields
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: payment.status,
        mp_payment_id: payment.id.toString(),
        payment_date: payment.date_approved || null,
        updated_at: new Date().toISOString(),
      })
      .eq('reservation_id', reservationId);

    if (paymentUpdateError) {
      console.error('Error updating payment:', paymentUpdateError);
    }

    // Update reservation status
    const { error: reservationUpdateError } = await supabase
      .from('reservations')
      .update({
        status: reservationStatus,
        payment_status: paymentStatus,
        payment_reference: payment.id.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (reservationUpdateError) {
      console.error('Error updating reservation:', reservationUpdateError);
    }

    console.log('Payment and reservation updated:', {
      reservation_id: reservationId,
      payment_status: paymentStatus,
      reservation_status: reservationStatus,
    });

    // Log to audit
    await supabase.from('payment_logs').insert({
      reservation_id: reservationId,
      action: 'webhook_notification',
      status: payment.status,
      response_payload: body
    });

    // Send appropriate email based on payment status
    if (reservation) {
      if (paymentStatus === 'paid') {
        await sendEmail(supabaseUrl, supabaseAnonKey, {
          type: 'payment_success',
          reservationId,
          email: reservation.guest_email,
          name: reservation.guest_name,
          paymentDetails: {
            method: reservation.payment_method,
            amount: payment.transaction_amount,
            paymentId: payment.id.toString(),
          },
        });

        await sendEmail(supabaseUrl, supabaseAnonKey, {
          type: 'reservation_confirmed',
          reservationId,
          email: reservation.guest_email,
          name: reservation.guest_name,
        });
      } else if (paymentStatus === 'failed') {
        await sendEmail(supabaseUrl, supabaseAnonKey, {
          type: 'payment_error',
          reservationId,
          email: reservation.guest_email,
          name: reservation.guest_name,
          errorMessage: payment.status_detail || 'Pagamento recusado',
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
