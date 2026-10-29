const { Client } = require('pg');

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
  const { email } = body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Adresse e-mail requise.' });
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

    // 1. Recherche de l'utilisateur
    const userRes = await pgClient.query(`
      SELECT id, email, email_confirmed_at, confirmation_sent_at
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
      await pgClient.end();
      return res.status(200).json({
        message: 'Cette adresse e-mail est déjà confirmée. Vous pouvez vous connecter directement.',
        alreadyConfirmed: true,
      });
    }

    // 2. Contrôle du délai de 60 secondes (cooldown anti-spam / sécurité)
    if (authUser.confirmation_sent_at) {
      const lastSentTime = new Date(authUser.confirmation_sent_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastSentTime) / 1000);
      const COOLDOWN_SECONDS = 60;

      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        await pgClient.end();
        return res.status(429).json({
          error: `Veuillez patienter encore ${remaining} secondes avant de demander un nouvel envoi.`,
          remainingSeconds: remaining,
        });
      }
    }

    // 3. Génération d'un nouveau code à 6 chiffres
    const newToken = Math.floor(100000 + Math.random() * 900000).toString();

    await pgClient.query(`
      UPDATE auth.users
      SET confirmation_token = $1,
          confirmation_sent_at = NOW(),
          updated_at = NOW()
      WHERE id = $2;
    `, [newToken, authUser.id]);

    await pgClient.end();

    // Envoi effectif de l'e-mail de confirmation
    let emailDelivery = { sent: false };
    try {
      const { sendConfirmationEmail } = require('../utils/mailer');
      emailDelivery = await sendConfirmationEmail(authUser.email, newToken);
    } catch (mErr) {
      console.warn('Erreur envoi mailer resend:', mErr.message);
    }

    try {
      const { recordAuditLog } = require('../utils/audit');
      await recordAuditLog({
        eventType: 'EMAIL_RESEND_REQUESTED',
        actionTitle: `Demande de renvoi du code de confirmation (${authUser.email})`,
        userEmail: authUser.email,
        module: 'AUTH',
        resourceType: 'users',
        resourceId: authUser.id,
        status: 'SUCCESS',
        details: { emailSent: emailDelivery.sent },
        req,
      });
    } catch {}

    const message = emailDelivery.sent
      ? `Un nouveau code de confirmation a été envoyé à votre adresse e-mail (${authUser.email}).`
      : `Le renvoi du code pour ${authUser.email} a été pris en compte. Si vous ne recevez rien dans les 60 secondes, vérifiez vos spams ou réessayez.`;

    return res.status(200).json({
      message,
      email: authUser.email,
      emailSent: emailDelivery.sent,
      devCode: !emailDelivery.sent ? newToken : undefined,
    });
  } catch (err) {
    console.error('Erreur API Resend Confirmation:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors du renvoi du code de confirmation.' });
  }
};
