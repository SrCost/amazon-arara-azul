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
    if (!mercadoPagoToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
    }

    const { reservationData, packageData, totalAmount } = await req.json();

    console.log('Creating Mercado Pago payment preference:', {
      totalAmount,
      guestName: reservationData.guestName,
      guestEmail: reservationData.guestEmail,
    });

    // Create payment preference in Mercado Pago
    const preference = {
      items: [
        {
          title: packageData 
            ? `Pacote ${packageData.name} - Pousada Arara Azul`
            : `Reserva Bangalô - Pousada Arara Azul`,
          description: packageData
            ? `${packageData.duration} - Check-in: ${reservationData.checkIn}, Check-out: ${reservationData.checkOut}`
            : `Check-in: ${reservationData.checkIn}, Check-out: ${reservationData.checkOut}, Hóspedes: ${reservationData.guests}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(totalAmount),
        },
      ],
      payer: {
        name: reservationData.guestName,
        email: reservationData.guestEmail,
        phone: reservationData.guestPhone ? {
          number: reservationData.guestPhone,
        } : undefined,
      },
      back_urls: {
        success: `${Deno.env.get('VITE_SUPABASE_URL')}/functions/v1/mercado-pago-webhook`,
        failure: `${req.headers.get('origin')}/reservas?status=failed`,
        pending: `${req.headers.get('origin')}/reservas?status=pending`,
      },
      auto_return: 'approved',
      external_reference: reservationData.reservationId || '',
      notification_url: `${Deno.env.get('VITE_SUPABASE_URL')}/functions/v1/mercado-pago-webhook`,
      statement_descriptor: 'Pousada Arara Azul',
      metadata: {
        reservation_id: reservationData.reservationId,
        room_id: reservationData.roomId,
        package_id: packageData?.id,
      },
    };

    console.log('Sending preference to Mercado Pago...');

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error('Mercado Pago API error:', errorData);
      throw new Error(`Mercado Pago API error: ${mpResponse.status} - ${errorData}`);
    }

    const mpData = await mpResponse.json();
    console.log('Mercado Pago preference created:', mpData.id);

    return new Response(
      JSON.stringify({
        success: true,
        init_point: mpData.init_point,
        preference_id: mpData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating Mercado Pago payment:', error);
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
