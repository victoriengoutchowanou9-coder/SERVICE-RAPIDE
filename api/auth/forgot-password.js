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
  const { email, emailOrIdentifier, identifier } = body;
  const rawInput = (email || emailOrIdentifier || identifier || '').trim();

  if (!rawInput) {
    return res.status(400).json({ error: 'Veuillez saisir votre adresse email.' });
  }

  let lookupEmail = rawInput.toLowerCase();
  if (lookupEmail === 'developer_admin' || lookupEmail === 'developer') {
    lookupEmail = 'developer_admin@servicerapide.africa';
  }

  const cleanDigits = rawInput.replace(/\D/g, '');

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

    // 1. Recherche du compte dans auth.users et public.users
    const userRes = await pgClient.query(`
      SELECT au.id, au.email, au.recovery_sent_at, u.identifier
      FROM auth.users au
      LEFT JOIN public.users u ON u.id = au.id
      WHERE LOWER(au.email) = LOWER($1)
         OR (u.identifier IS NOT NULL AND LOWER(u.identifier) = LOWER($1))
         OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER($1))
         OR ($2 != '' AND length($2) >= 8 AND (
             u."phoneNumber" = $1
             OR regexp_replace(u."phoneNumber", '\\D', '', 'g') = $2
         ))
      LIMIT 1;
    `, [lookupEmail, cleanDigits]);

    if (userRes.rows.length === 0) {
      await pgClient.end();
      // Réponse neutre pour la sécurité (évite le scan d'emails)
      return res.status(200).json({
        message: 'Si cette adresse correspond à un compte existant, un code de réinitialisation vous a été envoyé.',
        email: lookupEmail,
      });
    }

    const authUser = userRes.rows[0];

    // Contrôle anti-spam 60 secondes entre deux demandes
    if (authUser.recovery_sent_at) {
      const elapsed = Math.floor((Date.now() - new Date(authUser.recovery_sent_at).getTime()) / 1000);
      if (elapsed < 60) {
        const remaining = 60 - elapsed;
        await pgClient.end();
        return res.status(429).json({
          error: `Veuillez patienter encore ${remaining} secondes avant de demander un nouveau code.`,
          remainingSeconds: remaining,
        });
      }
    }

    // 2. Génération du code de récupération à 6 chiffres
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    await pgClient.query(`
      UPDATE auth.users
      SET recovery_token = $1,
          recovery_sent_at = NOW(),
          updated_at = NOW()
      WHERE id = $2;
    `, [recoveryCode, authUser.id]);

    await pgClient.end();

    return res.status(200).json({
      message: 'Un code de réinitialisation à 6 chiffres a été envoyé à votre adresse email.',
      email: authUser.email,
    });
  } catch (err) {
    console.error('Erreur API Forgot Password:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors de la demande de réinitialisation.' });
  }
};
