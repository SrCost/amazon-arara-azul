// Mercado Pago Configuration
// Note: This is a PUBLIC key, safe to expose in frontend code
// The PRIVATE/SECRET key is stored securely in Supabase secrets

export const MERCADO_PAGO_CONFIG = {
  // Public key for frontend SDK - this will be loaded from environment or fallback
  publicKey: import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || '',
  
  // SDK URL
  sdkUrl: 'https://sdk.mercadopago.com/js/v2',
};

// Helper to check if Mercado Pago is configured
export const isMercadoPagoConfigured = () => {
  return Boolean(MERCADO_PAGO_CONFIG.publicKey);
};
