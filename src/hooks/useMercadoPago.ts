import { useState, useEffect, useCallback } from 'react';
import { MERCADO_PAGO_CONFIG, isMercadoPagoConfigured } from '@/config/mercadoPago';

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

export const useMercadoPago = (): UseMercadoPagoReturn => {
  const [mercadoPago, setMercadoPago] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isConfigured = isMercadoPagoConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      setError('Mercado Pago public key not configured');
      console.warn('⚠️ VITE_MERCADO_PAGO_PUBLIC_KEY not found in environment');
      return;
    }

    // Check if SDK is already loaded
    if (window.MercadoPago) {
      try {
        const mp = new window.MercadoPago(MERCADO_PAGO_CONFIG.publicKey);
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
        const mp = new window.MercadoPago(MERCADO_PAGO_CONFIG.publicKey);
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
  }, [isConfigured]);

  const createCardToken = useCallback(async (cardData: CardData) => {
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
  }, [mercadoPago]);

  return {
    mercadoPago,
    isLoading,
    isConfigured,
    error,
    createCardToken,
  };
};
