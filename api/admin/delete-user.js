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

    const userRes = await pgClient.query('SELECT id, email, role FROM public.users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      await pgClient.end();
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const userEmail = userRes.rows[0].email;
    const userRole = userRes.rows[0].role;

    // Protection anti-suppression du compte développeur principal
    if (userRole === 'DEVELOPER' || userEmail === 'developer_admin@servicerapide.africa') {
      await pgClient.end();
      return res.status(403).json({ error: 'Impossible de supprimer le compte superviseur racine.' });
    }

    // Suppression en cascade dans public.users et auth.users
    await pgClient.query('DELETE FROM public.users WHERE id = $1', [userId]);
    await pgClient.query('DELETE FROM auth.users WHERE id = $1', [userId]);
    await pgClient.end();

    // Audit log
    await recordAuditLog({
      eventType: 'USER_DELETED',
      actionTitle: `Suppression définitive du compte utilisateur (${userEmail})`,
      userEmail,
      userRole,
      module: 'ADMIN_MODERATION',
      resourceType: 'users',
      resourceId: userId,
      status: 'SUCCESS',
      details: { executedBy: auth.user.email },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Compte ${userEmail} définitivement supprimé.`,
    });
  } catch (err) {
    console.error('Erreur API Admin Delete User:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne de suppression utilisateur.' });
  }
};
