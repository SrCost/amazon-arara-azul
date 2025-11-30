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
    case 'processed':
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

    // Handle both payment and order notifications
    const notificationType = body.type;
    const dataId = body.data?.id;

    if (!dataId) {
      console.log('No data ID in webhook, ignoring');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let paymentInfo: any = null;
    let externalReference: string | null = null;

    // Fetch details based on notification type
    if (notificationType === 'payment') {
      // Fetch payment details
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${dataId}`,
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

      paymentInfo = await mpResponse.json();
      externalReference = paymentInfo.external_reference;
      
      console.log('Payment details:', {
        id: paymentInfo.id,
        status: paymentInfo.status,
        status_detail: paymentInfo.status_detail,
        external_reference: externalReference,
      });
    } else if (notificationType === 'order' || body.action?.includes('order')) {
      // Fetch order details
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/orders/${dataId}`,
        {
          headers: {
            'Authorization': `Bearer ${mercadoPagoToken}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error(`Failed to fetch order details: ${mpResponse.status}`);
        throw new Error(`Failed to fetch order details: ${mpResponse.status}`);
      }

      const orderData = await mpResponse.json();
      externalReference = orderData.external_reference;
      
      // Get payment info from order
      const orderPayment = orderData.transactions?.payments?.[0];
      paymentInfo = {
        id: orderPayment?.id || orderData.id,
        status: orderPayment?.status || orderData.status,
        status_detail: orderPayment?.status_detail || orderData.status_detail,
        external_reference: externalReference,
        transaction_amount: parseFloat(orderData.total_amount),
        date_approved: orderPayment?.date_approved || orderData.date_approved,
      };

      console.log('Order details:', {
        order_id: orderData.id,
        payment_id: paymentInfo.id,
        status: paymentInfo.status,
        external_reference: externalReference,
      });
    } else {
      console.log(`Unhandled notification type: ${notificationType}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!externalReference) {
      console.log('No external reference found, ignoring');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const reservationId = externalReference;
    const paymentStatus = mapMpStatusToPaymentStatus(paymentInfo.status);
    const reservationStatus = mapToReservationStatus(paymentStatus);

    // Get reservation details for email
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    // Update payment record
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: paymentInfo.status,
        payment_date: paymentInfo.date_approved || null,
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
      payment_id: paymentInfo.id?.toString(),
      action: 'webhook_notification',
      status: paymentInfo.status,
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
            amount: paymentInfo.transaction_amount,
            paymentId: paymentInfo.id?.toString(),
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
          errorMessage: paymentInfo.status_detail || 'Pagamento recusado',
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
