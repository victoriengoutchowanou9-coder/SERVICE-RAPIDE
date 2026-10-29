const { Client } = require('pg');
const crypto = require('crypto');

function createJwtToken(payload, secret, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const base64UrlEncode = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(fullPayload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const body = req.body || {};
  const { email, token, code, otp } = body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const inputCode = (token || code || otp || '').toString().trim();

  if (!cleanEmail || !inputCode) {
    return res.status(400).json({ error: 'Email et code de confirmation requis.' });
  }

  const pgClient = new Client({
    host: process.env.DB_HOST || 'aws-0-eu-west-1.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '6543'),
    user: process.env.DB_USERNAME || 'postgres.gsgbvoyddagpjldgeyqk',
    password: process.env.DB_PASSWORD || 'BI6PbBYPGqNFppwx',
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pgClient.connect();

    // 1. Recherche du compte dans auth.users
    const userRes = await pgClient.query(`
      SELECT id, email, confirmation_token, email_confirmed_at
      FROM auth.users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `, [cleanEmail]);

    if (userRes.rows.length === 0) {
      await pgClient.end();
      return res.status(404).json({ error: 'Aucun compte associé à cette adresse e-mail.' });
    }

    const authUser = userRes.rows[0];

    // Si déjà confirmé
    if (authUser.email_confirmed_at) {
      const pubUserRes = await pgClient.query(`SELECT * FROM public.users WHERE id = $1 LIMIT 1;`, [authUser.id]);
      const pubUser = pubUserRes.rows[0] || {};
      const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
      const token = createJwtToken({ sub: authUser.id, email: authUser.email, role: pubUser.role || 'CLIENT' }, jwtSecret);

      await pgClient.end();
      return res.status(200).json({
        message: 'Votre adresse e-mail est déjà confirmée.',
        accessToken: token,
        user: pubUser,
      });
    }

    // 2. Vérification du code
    if (!authUser.confirmation_token || authUser.confirmation_token !== inputCode) {
      await pgClient.end();
      try {
        const { recordAuditLog } = require('../utils/audit');
        await recordAuditLog({
          eventType: 'EMAIL_CONFIRM_FAILED',
          actionTitle: `Échec confirmation e-mail : code incorrect ou expiré (${cleanEmail})`,
          userEmail: cleanEmail,
          module: 'AUTH',
          resourceType: 'users',
          status: 'FAILURE',
          details: { reason: 'INVALID_TOKEN' },
          req,
        });
      } catch {}
      return res.status(400).json({ error: 'Code de confirmation incorrect ou expiré.' });
    }

    // 3. Validation de l'adresse email
    await pgClient.query(`
      UPDATE auth.users
      SET email_confirmed_at = NOW(),
          confirmation_token = NULL,
          updated_at = NOW()
      WHERE id = $1;
    `, [authUser.id]);

    // Récupérer le profil public
    const pubRes = await pgClient.query(`SELECT * FROM public.users WHERE id = $1 LIMIT 1;`, [authUser.id]);
    const pubUser = pubRes.rows[0] || {};

    const provRes = await pgClient.query(`SELECT * FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;`, [authUser.id]);
    const providerProfile = provRes.rows[0] || null;

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
    const accessToken = createJwtToken(
      { sub: authUser.id, email: authUser.email, role: pubUser.role || 'CLIENT' },
      jwtSecret
    );

    await pgClient.end();

    try {
      const { recordAuditLog } = require('../utils/audit');
      await recordAuditLog({
        eventType: 'EMAIL_CONFIRMED',
        actionTitle: `Adresse e-mail confirmée et validée avec succès (${cleanEmail})`,
        userEmail: cleanEmail,
        userRole: pubUser.role || 'CLIENT',
        module: 'AUTH',
        resourceType: 'users',
        resourceId: authUser.id,
        status: 'SUCCESS',
        details: { method: 'EMAIL_OTP_VERIFIED' },
        req,
      });
    } catch {}

    return res.status(200).json({
      message: 'Adresse e-mail confirmée avec succès ! Votre compte est activé.',
      accessToken,
      user: {
        ...pubUser,
        providerProfile,
      },
    });
  } catch (err) {
    console.error('Erreur API Confirm Email:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors de la confirmation de l\'e-mail.' });
  }
};
