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
const { requireAdminAuth } = require('../utils/admin-auth');
const { recordAuditLog } = require('../utils/audit');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  const auth = requireAdminAuth(req, res);
  if (!auth.authorized) return;

  const { subId } = req.body || {};
  if (!subId) {
    return res.status(400).json({ error: 'subId requis.' });
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

    // Mettre à jour l'abonnement du profil prestataire +30 jours
    const updateRes = await pgClient.query(`
      UPDATE public.provider_profiles
      SET "subscriptionExpiresAt" = GREATEST("subscriptionExpiresAt", NOW()) + INTERVAL '30 days',
          "isTrialUsed" = true,
          "updatedAt" = NOW()
      WHERE id = $1
      RETURNING id, "userId", "subscriptionExpiresAt";
    `, [subId]);

    if (updateRes.rows.length === 0) {
      await pgClient.end();
      return res.status(404).json({ error: 'Profil prestataire introuvable.' });
    }

    const row = updateRes.rows[0];
    const userRes = await pgClient.query('SELECT email FROM public.users WHERE id = $1', [row.userId]);
    const userEmail = userRes.rows[0]?.email || 'Prestataire';

    await pgClient.end();

    // Audit log
    await recordAuditLog({
      eventType: 'SUBSCRIPTION_EXTENDED',
      actionTitle: `Prolongation manuelle abonnement prestataire (+30j) pour ${userEmail}`,
      userEmail,
      userRole: 'PROVIDER',
      module: 'ADMIN_SUBSCRIPTIONS',
      resourceType: 'provider_profiles',
      resourceId: subId,
      status: 'SUCCESS',
      details: {
        newExpiresAt: row.subscriptionExpiresAt,
        grantedBy: auth.user.email,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Abonnement prolongé de 30 jours avec succès.',
      expiresAt: new Date(row.subscriptionExpiresAt).toLocaleDateString('fr-FR'),
    });
  } catch (err) {
    console.error('Erreur API Admin Extend Sub:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne de prolongation abonnement.' });
  }
};
