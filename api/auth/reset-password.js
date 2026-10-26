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
  const { email, emailOrIdentifier, code, token, newPassword } = body;
  const cleanEmail = (email || emailOrIdentifier || '').trim().toLowerCase();
  const inputCode = (code || token || '').toString().trim();
  const password = (newPassword || '').trim();

  if (!cleanEmail || !inputCode) {
    return res.status(400).json({ error: 'Adresse email et code de réinitialisation requis.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
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

    // 1. Recherche du compte et vérification du code
    const userRes = await pgClient.query(`
      SELECT id, email, recovery_token, recovery_sent_at
      FROM auth.users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `, [cleanEmail]);

    if (userRes.rows.length === 0) {
      await pgClient.end();
      return res.status(404).json({ error: 'Aucun compte associé à cette adresse e-mail.' });
    }

    const authUser = userRes.rows[0];

    // Vérification de validité du code
    if (!authUser.recovery_token || authUser.recovery_token !== inputCode) {
      await pgClient.end();
      return res.status(400).json({ error: 'Code de réinitialisation incorrect ou expiré.' });
    }

    // Vérification expiration (code valide pendant 30 minutes)
    if (authUser.recovery_sent_at) {
      const elapsedMinutes = (Date.now() - new Date(authUser.recovery_sent_at).getTime()) / (1000 * 60);
      if (elapsedMinutes > 30) {
        await pgClient.end();
        return res.status(400).json({ error: 'Ce code a expiré (durée de validité : 30 minutes). Veuillez en demander un nouveau.' });
      }
    }

    // 2. Mise à jour sécurisée du mot de passe dans auth.users
    await pgClient.query(`
      UPDATE auth.users
      SET encrypted_password = crypt($1, gen_salt('bf')),
          recovery_token = NULL,
          updated_at = NOW()
      WHERE id = $2;
    `, [password, authUser.id]);

    // 3. Mise à jour du hash dans public.users
    try {
      await pgClient.query(`
        UPDATE public.users
        SET "passwordHash" = crypt($1, gen_salt('bf')),
            "updatedAt" = NOW()
        WHERE id = $2;
      `, [password, authUser.id]);
    } catch (pubErr) {
      console.warn('Note public.users password update:', pubErr.message);
    }

    await pgClient.end();

    return res.status(200).json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.',
    });
  } catch (err) {
    console.error('Erreur API Reset Password:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors de la réinitialisation du mot de passe.' });
  }
};
