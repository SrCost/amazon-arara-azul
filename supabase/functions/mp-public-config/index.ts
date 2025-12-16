import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function detectEnvFromKey(key: string): "test" | "prod" | "unknown" {
  if (!key) return "unknown";
  if (key.startsWith("TEST-")) return "test";
  if (key.startsWith("APP_USR-")) return "prod";
  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get("VITE_MERCADO_PAGO_PUBLIC_KEY") || "";
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";

    const publicEnv = detectEnvFromKey(publicKey);
    const privateEnv = detectEnvFromKey(accessToken);

    const mismatch =
      publicEnv !== "unknown" &&
      privateEnv !== "unknown" &&
      publicEnv !== privateEnv;

    return new Response(
      JSON.stringify({
        publicKey,
        env: {
          public: publicEnv,
          private: privateEnv,
        },
        mismatch,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("mp-public-config error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
