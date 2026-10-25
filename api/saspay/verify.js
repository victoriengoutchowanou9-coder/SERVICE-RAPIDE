const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ error: "L'identifiant de session (id) est obligatoire." });
  }

  const apiKey = process.env.SASPAY_SECRET_KEY || 'sk_live_zTWcFSZTR-tVdHkzYJyDI5_NfOyRT-hxlBXKAVC6HNo';

  const options = {
    hostname: 'api.saspay.me',
    path: `/api/v1/checkout-sessions/${encodeURIComponent(id)}/`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
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

  apiReq.end();
};
