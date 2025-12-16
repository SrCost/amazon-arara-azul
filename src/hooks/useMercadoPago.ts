import { useState, useEffect, useCallback } from 'react';
import { MERCADO_PAGO_CONFIG } from '@/config/mercadoPago';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface UseMercadoPagoReturn {
  mercadoPago: any | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  createCardToken: (cardData: CardData) => Promise<{ id: string } | null>;
  getPaymentMethodFromBin: (bin: string) => Promise<string>;
}

interface CardData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

type MpPublicConfig = {
  publicKey: string;
  env?: {
    public?: 'test' | 'prod' | 'unknown';
    private?: 'test' | 'prod' | 'unknown';
  };
  mismatch?: boolean;
};

export const useMercadoPago = (): UseMercadoPagoReturn => {
  const [mercadoPago, setMercadoPago] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prefer runtime config (from backend function) so key changes take effect without a rebuild.
  const [publicKey, setPublicKey] = useState<string>(MERCADO_PAGO_CONFIG.publicKey || '');

  // Fetch runtime public key + env mismatch info
  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeConfig() {
      try {
        const { data, error: fnError } = await supabase.functions.invoke<MpPublicConfig>('mp-public-config');
        if (fnError) throw fnError;

        if (!cancelled && data?.publicKey) {
          setPublicKey(data.publicKey);

          if (data.mismatch) {
            setError(
              'Credenciais do Mercado Pago estão em ambientes diferentes (TEST vs Produção). Ajuste o Public Key e o Access Token para o mesmo ambiente.'
            );
          }
        }
      } catch (e) {
        // Silent fallback to build-time env key
      }
    }

    loadRuntimeConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const isConfigured = Boolean(publicKey);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      setError('Mercado Pago public key not configured');
      console.warn('⚠️ Mercado Pago public key not configured');
      return;
    }

    // If we already detected mismatch, avoid initializing SDK (tokenization will fail)
    if (error?.includes('ambientes diferentes')) {
      setIsLoading(false);
      return;
    }

    // Check if SDK is already loaded
    if (window.MercadoPago) {
      try {
        const mp = new window.MercadoPago(publicKey);
        setMercadoPago(mp);
        setIsLoading(false);
        console.log('✅ Mercado Pago SDK already loaded');
        return;
      } catch (err) {
        console.error('Error initializing Mercado Pago:', err);
      }
    }

    // Load SDK script
    const existingScript = document.querySelector(`script[src="${MERCADO_PAGO_CONFIG.sdkUrl}"]`);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = MERCADO_PAGO_CONFIG.sdkUrl;
    script.async = true;

    script.onload = () => {
      try {
        const mp = new window.MercadoPago(publicKey);
        setMercadoPago(mp);
        setIsLoading(false);
        setError(null);
        console.log('✅ Mercado Pago SDK loaded successfully');
      } catch (err) {
        setError('Failed to initialize Mercado Pago SDK');
        setIsLoading(false);
        console.error('❌ Error initializing Mercado Pago:', err);
      }
    };

    script.onerror = () => {
      setError('Failed to load Mercado Pago SDK');
      setIsLoading(false);
      console.error('❌ Failed to load Mercado Pago SDK script');
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [isConfigured, publicKey, error]);

  // Get payment method ID from card BIN (first 6 digits)
  const getPaymentMethodFromBin = useCallback(
    async (bin: string): Promise<string> => {
      if (!publicKey) {
        console.warn('Mercado Pago public key missing, using fallback detection');
        return detectCardBrandFallback(bin);
      }

      try {
        const response = await fetch(
          `https://api.mercadopago.com/v1/payment_methods/search?bins=${bin}&public_key=${publicKey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const paymentMethodId = data.results[0].id;
            console.log('✅ Payment method identified by Mercado Pago:', paymentMethodId);
            return paymentMethodId;
          }
        }

        console.warn('Could not identify payment method from Mercado Pago API, using fallback');
        return detectCardBrandFallback(bin);
      } catch (err) {
        console.error('Error getting payment method:', err);
        return detectCardBrandFallback(bin);
      }
    },
    [publicKey]
  );

  const createCardToken = useCallback(
    async (cardData: CardData) => {
      if (!mercadoPago) {
        console.error('Mercado Pago SDK not initialized');
        return null;
      }

      try {
        const token = await mercadoPago.createCardToken(cardData);
        return token;
      } catch (err) {
        console.error('Error creating card token:', err);
        throw err;
      }
    },
    [mercadoPago]
  );

  return {
    mercadoPago,
    isLoading,
    isConfigured,
    error,
    createCardToken,
    getPaymentMethodFromBin,
  };
};

// Fallback card brand detection based on BIN patterns
function detectCardBrandFallback(bin: string): string {
  const cleanBin = bin.replace(/\D/g, '');

  // Visa
  if (/^4/.test(cleanBin)) {
    return 'visa';
  }

  // Mastercard
  if (/^5[1-5]/.test(cleanBin) || /^2[2-7]/.test(cleanBin)) {
    return 'master';
  }

  // Amex
  if (/^3[47]/.test(cleanBin)) {
    return 'amex';
  }

  // Elo - common Brazilian card
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/.test(cleanBin)) {
    return 'elo';
  }

  // Hipercard
  if (/^(606282|384100|384140|384160)/.test(cleanBin)) {
    return 'hipercard';
  }

  // Default to visa for testing purposes (most common)
  console.warn('Could not detect card brand, defaulting to visa');
  return 'visa';
}
