const https = require('https');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const apiKey = process.env.SASPAY_SECRET_KEY || 'sk_live_zTWcFSZTR-tVdHkzYJyDI5_NfOyRT-hxlBXKAVC6HNo';

  try {
    const {
      amount,
      currency = 'XOF',
      customer_name = 'Client SERVICE RAPIDE',
      customer_email = 'client@servicerapide.africa',
      customer_phone = '',
      network = '',
      return_url,
      cancel_url,
      metadata = {},
    } = req.body || {};

    if (!amount) {
      return res.status(400).json({ error: 'Le montant (amount) est obligatoire.' });
    }

    // Préparation du payload pour SasPay
    const payload = JSON.stringify({
      amount: Number(amount).toFixed(2),
      currency: currency || 'XOF',
      customer_name: customer_name || 'Client SERVICE RAPIDE',
      customer_email: customer_email || 'client@servicerapide.africa',
      customer_phone: customer_phone || '',
      ...(network ? { network } : {}),
      return_url: return_url || 'https://servicerapide.vercel.app/app?payment_status=success',
      cancel_url: cancel_url || 'https://servicerapide.vercel.app/app?payment_status=cancelled',
      metadata,
    });

    const options = {
      hostname: 'api.saspay.me',
      path: '/api/v1/checkout-sessions/',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => (data += chunk));
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          return res.status(apiRes.statusCode).json(json);
        } catch (e) {
          return res.status(500).json({ error: 'Réponse SasPay invalide', raw: data });
        }
      });
    });

    apiReq.on('error', (err) => {
      return res.status(502).json({ error: 'Erreur réseau SasPay', details: err.message });
    });

    apiReq.write(payload);
    apiReq.end();
  } catch (err) {
    return res.status(500).json({ error: 'Erreur interne', details: err.message });
  }
};
