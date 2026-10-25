const https = require('https');
let pg;
try {
  pg = require('pg');
} catch (e) {
  try {
    pg = require('../../backend/node_modules/pg');
  } catch (e2) {
    pg = require('../backend/node_modules/pg');
  }
}
const { Client } = pg;

function getPgClient() {
  return new Client({
    host: process.env.DB_HOST || 'aws-0-eu-west-1.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '6543'),
    user: process.env.DB_USERNAME || 'postgres.gsgbvoyddagpjldgeyqk',
    password: process.env.DB_PASSWORD || 'BI6PbBYPGqNFppwx',
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, session_id } = req.query || req.body || {};
  const sessionId = id || session_id;

  if (!sessionId) {
    return res.status(400).json({ error: "L'identifiant de session de paiement est obligatoire." });
  }

  const apiKey = process.env.SASPAY_SECRET_KEY || 'sk_live_zTWcFSZTR-tVdHkzYJyDI5_NfOyRT-hxlBXKAVC6HNo';

  // 1. Interrogation directe de l'API SasPay
  const options = {
    hostname: 'api.saspay.me',
    path: `/api/v1/checkout-sessions/${encodeURIComponent(sessionId)}/`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => (data += chunk));
    apiRes.on('end', async () => {
      try {
        const json = JSON.parse(data);
        const sessionData = json.data || json;

        const isSuccess =
          sessionData.status === 'SUCCESS' ||
          sessionData.status === 'PAID' ||
          sessionData.payment_status === 'paid' ||
          sessionData.state === 'COMPLETED';

        const isFailed =
          sessionData.status === 'FAILED' ||
          sessionData.status === 'CANCELLED' ||
          sessionData.payment_status === 'failed' ||
          sessionData.payment_status === 'cancelled';

        const metadata = sessionData.metadata || {};
        const action = metadata.action || metadata.type;
        const adId = metadata.adId;
        const durationWeeks = Math.max(1, parseInt(metadata.durationWeeks || 1, 10));

        // 2. Traitement sécurisé en base de données selon le résultat SasPay
        if (adId) {
          const pgClient = getPgClient();
          try {
            await pgClient.connect();

            if (isSuccess) {
              // Confirmation effective : activation de la publicité pour la durée payée
              await pgClient.query(`
                UPDATE public.advertisements
                SET
                  status = 'ACTIVE',
                  "isActive" = true,
                  "startDate" = COALESCE("startDate", NOW()),
                  "endDate" = NOW() + ($1 || ' days')::interval,
                  "paymentReference" = $2,
                  "updatedAt" = NOW()
                WHERE id::text = $3;
              `, [durationWeeks * 7, sessionId, adId]);

              console.log(`✅ [Verify] Publicité ${adId} ACTIVÉE avec succès après confirmation SasPay.`);
            } else if (isFailed) {
              // Échec avéré : suspension immédiate de la publicité
              await pgClient.query(`
                UPDATE public.advertisements
                SET
                  status = 'PAYMENT_FAILED',
                  "isActive" = false,
                  "updatedAt" = NOW()
                WHERE id::text = $1 AND status != 'ACTIVE';
              `, [adId]);

              console.log(`❌ [Verify] Publicité ${adId} bloquée : paiement SasPay échoué (${sessionData.status}).`);
            }

            await pgClient.end();
          } catch (dbErr) {
            console.error('Erreur DB verify session:', dbErr.message);
            try { await pgClient.end(); } catch (e) {}
          }
        }

        return res.status(200).json({
          verified: true,
          isPaid: isSuccess,
          status: sessionData.status || (isSuccess ? 'SUCCESS' : isFailed ? 'FAILED' : 'PENDING'),
          metadata: sessionData.metadata,
        });
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
