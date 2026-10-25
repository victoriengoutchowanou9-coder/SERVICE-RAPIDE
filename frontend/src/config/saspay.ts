/**
 * Intégration SasPay Mobile Money (Côte d'Ivoire, Bénin, Sénégal, Burkina Faso, Cameroun, etc.)
 * Clé de production active : sk_live_zTWcFSZTR-tVdHkzYJyDI5_NfOyRT-hxlBXKAVC6HNo
 */

export interface SaspayCheckoutParams {
  amount: number;
  currency?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  network?: string;
  metadata?: Record<string, any>;
  return_url?: string;
}

export const saspayClient = {
  /**
   * Initialise une session de paiement Mobile Money SasPay
   * et retourne l'URL de paiement sécurisée
   */
  async createCheckoutSession(params: SaspayCheckoutParams): Promise<string> {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://servicerapide.vercel.app';

    const payload = {
      amount: params.amount,
      currency: params.currency || 'XOF',
      customer_name: params.customer_name || 'Client SERVICE RAPIDE',
      customer_email: params.customer_email || 'client@servicerapide.africa',
      customer_phone: params.customer_phone || '',
      network: params.network || '',
      return_url: params.return_url || `${origin}/app?payment=success`,
      cancel_url: `${origin}/app?payment=cancelled`,
      metadata: params.metadata || {},
    };

    // 1. Tenter via la route serverless Vercel /api/saspay/checkout
    try {
      const res = await fetch('/api/saspay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.checkout_url) {
          return data.data.checkout_url;
        }
      }
    } catch (e) {
      console.warn('Fallback direct SasPay API :', e);
    }

    // 2. Fallback direct sécurisé vers l'API SasPay
    const directRes = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk_live_zTWcFSZTR-tVdHkzYJyDI5_NfOyRT-hxlBXKAVC6HNo',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(params.amount).toFixed(2),
        currency: params.currency || 'XOF',
        customer_name: params.customer_name || 'Client SERVICE RAPIDE',
        customer_email: params.customer_email || 'client@servicerapide.africa',
        customer_phone: params.customer_phone || '',
        return_url: params.return_url || `${origin}/app?payment=success`,
        metadata: params.metadata || {},
      }),
    });

    const directData = await directRes.json();
    if (directData?.data?.checkout_url) {
      return directData.data.checkout_url;
    }

    throw new Error(
      directData?.error
        ? typeof directData.error === 'string'
          ? directData.error
          : JSON.stringify(directData.error)
        : 'Impossible d’initialiser le paiement SasPay.'
    );
  },
};
