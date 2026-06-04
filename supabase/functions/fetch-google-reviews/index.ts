import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    const GOOGLE_PLACE_ID = Deno.env.get("GOOGLE_PLACE_ID");

    if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) {
      return new Response(
        JSON.stringify({ error: "Google API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch reviews from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=reviews&key=${GOOGLE_API_KEY}&language=pt-BR`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.result?.reviews) {
      console.error("Google API error:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ message: "Using cached reviews", status: data.status, error_message: data.error_message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter rating >= 4 and limit to 6
    const filtered = data.result.reviews
      .filter((r: any) => r.rating >= 4)
      .slice(0, 6);

    // Safety: don't wipe cache if API returned no usable reviews
    if (filtered.length === 0) {
      console.warn("No reviews with rating >= 4 returned; keeping existing cache");
      return new Response(
        JSON.stringify({ success: true, count: 0, message: "cache preserved" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear old cache and insert new
    await supabase.from("google_reviews_cache").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    for (const review of filtered) {
      await supabase.from("google_reviews_cache").insert({
        author_name: review.author_name || "Anônimo",
        rating: review.rating,
        text: review.text || "",
        profile_photo_url: review.profile_photo_url || null,
        review_date: review.time ? new Date(review.time * 1000).toISOString() : null,
      });
    }

    return new Response(
      JSON.stringify({ success: true, count: filtered.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
