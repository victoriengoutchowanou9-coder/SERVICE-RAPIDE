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

  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId requis.' });
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

    // Récupérer statut actuel
    const userRes = await pgClient.query('SELECT id, email, "isActive" FROM public.users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      await pgClient.end();
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const currentStatus = userRes.rows[0].isActive !== false;
    const nextStatus = !currentStatus;

    await pgClient.query('UPDATE public.users SET "isActive" = $1, "updatedAt" = NOW() WHERE id = $2', [nextStatus, userId]);
    await pgClient.end();

    // Audit log
    await recordAuditLog({
      eventType: nextStatus ? 'ACCOUNT_UNBLOCKED' : 'ACCOUNT_BLOCKED',
      actionTitle: nextStatus
        ? `Déblocage du compte (${userRes.rows[0].email})`
        : `Suspension du compte (${userRes.rows[0].email})`,
      userEmail: userRes.rows[0].email,
      module: 'ADMIN_MODERATION',
      resourceType: 'users',
      resourceId: userId,
      status: 'SUCCESS',
      details: { newIsActive: nextStatus, executedBy: auth.user.email },
      req,
    });

    return res.status(200).json({
      success: true,
      isActive: nextStatus,
      message: nextStatus ? 'Compte débloqué avec succès.' : 'Compte suspendu avec succès.',
    });
  } catch (err) {
    console.error('Erreur API Admin Toggle Block:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne de modification du statut.' });
  }
};
