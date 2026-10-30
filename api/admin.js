const { Client } = require('pg');
const { requireAdminAuth } = require('../lib/admin-auth');
const { recordAuditLog } = require('../lib/audit');

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

// =====================================================================
// ACTION: overview (GET) — Console développeur
// =====================================================================
async function handleOverview(req, res, auth) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez GET.' });
  }

  const pgClient = getPgClient();

  try {
    await pgClient.connect();

    // 2. Utilisateurs réels
    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName",
        CONCAT(COALESCE(u."firstName", ''), ' ', COALESCE(u."lastName", '')) AS "fullName",
        u."phoneNumber",
        u.role,
        u.country,
        u.city,
        COALESCE(u."isActive", true) AS "isActive",
        u."createdAt",
        pp."subscriptionExpiresAt",
        pp."isTrialUsed"
      FROM public.users u
      LEFT JOIN public.provider_profiles pp ON pp."userId" = u.id
      ORDER BY u."createdAt" DESC
      LIMIT 100;
    `;
    const usersRes = await pgClient.query(usersQuery);

    const users = usersRes.rows.map((row) => {
      let subscriptionStatus = 'TRIAL';
      if (row.role === 'PROVIDER' && row.subscriptionExpiresAt) {
        const expiresAt = new Date(row.subscriptionExpiresAt).getTime();
        if (expiresAt > Date.now()) {
          subscriptionStatus = row.isTrialUsed ? 'ACTIVE' : 'TRIAL';
        } else {
          subscriptionStatus = 'EXPIRED';
        }
      } else if (row.role === 'CLIENT') {
        subscriptionStatus = 'ACTIVE';
      }

      return {
        id: row.id,
        email: row.email,
        fullName: row.fullName.trim() || row.email,
        phoneNumber: row.phoneNumber || 'Non renseigné',
        role: row.role || 'CLIENT',
        country: row.country || 'Bénin',
        city: row.city || 'Cotonou',
        isActive: row.isActive,
        createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : '-',
        subscriptionStatus,
      };
    });

    // 3. Activités récentes réelles (audit logs)
    const activitiesQuery = `
      SELECT 
        id,
        event_type,
        action_title,
        user_email,
        user_role,
        module,
        status,
        details,
        created_at
      FROM public.system_audit_logs
      ORDER BY created_at DESC
      LIMIT 100;
    `;
    const activitiesRes = await pgClient.query(activitiesQuery);

    const activities = activitiesRes.rows.map((row) => ({
      id: row.id,
      timestamp: row.created_at
        ? new Date(row.created_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
      type: row.event_type || 'ACTIVITE',
      accountEmail: row.user_email || 'Système',
      details: row.action_title || 'Opération enregistrée',
      module: row.module || 'SYSTEM',
      status: row.status || 'SUCCESS',
    }));

    // 4. Incidents & Erreurs réels
    const errorsQuery = `
      SELECT 
        id,
        action_title,
        module,
        user_email,
        details,
        created_at
      FROM public.system_audit_logs
      WHERE status = 'FAILURE'
      ORDER BY created_at DESC
      LIMIT 50;
    `;
    const errorsRes = await pgClient.query(errorsQuery);

    const errors = errorsRes.rows.map((row) => ({
      id: row.id,
      timestamp: row.created_at
        ? new Date(row.created_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
      module: row.module || 'AUTH_SERVER',
      message: `${row.action_title} (${row.user_email || 'Anonyme'})`,
      resolved: false,
    }));

    // 5. Abonnements réels issus de la base
    const subsQuery = `
      SELECT 
        pp.id,
        u.email,
        pp."subscriptionExpiresAt",
        pp."isTrialUsed",
        COALESCE(SUM(p.amount), 0) AS "totalPaid"
      FROM public.provider_profiles pp
      JOIN public.users u ON u.id = pp."userId"
      LEFT JOIN public.payments p ON p."userId" = u.id AND p.status = 'COMPLETED'
      GROUP BY pp.id, u.email, pp."subscriptionExpiresAt", pp."isTrialUsed"
      LIMIT 50;
    `;
    const subsRes = await pgClient.query(subsQuery);

    const subscriptions = subsRes.rows.map((row) => {
      const expiresAt = row.subscriptionExpiresAt ? new Date(row.subscriptionExpiresAt) : new Date();
      const isExpired = expiresAt.getTime() < Date.now();
      const status = isExpired ? 'EXPIRED' : row.isTrialUsed ? 'ACTIVE' : 'TRIAL';

      return {
        id: row.id,
        userEmail: row.email,
        accountType: 'Prestataire',
        status,
        expiresAt: expiresAt.toLocaleDateString('fr-FR'),
        amountPaid: Number(row.totalPaid) || (status === 'ACTIVE' ? 5000 : 0),
        paymentRef: row.isTrialUsed ? 'PAIEMENT-VALIDE' : 'ESSAI-GRATUIT-30J',
      };
    });

    // 6. Métriques financières & opérationnelles réelles calculées
    const metricsRes = await pgClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.users) AS total_users,
        (SELECT COUNT(*) FROM public.users WHERE role = 'CLIENT') AS total_clients,
        (SELECT COUNT(*) FROM public.users WHERE role = 'PROVIDER') AS total_providers,
        (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'COMPLETED') AS total_revenue,
        (SELECT COUNT(*) FROM public.advertisements WHERE "isActive" = true) AS total_active_ads,
        (SELECT COUNT(*) FROM public.system_audit_logs) AS total_logs
    `);
    const m = metricsRes.rows[0] || {};

    await pgClient.end();

    return res.status(200).json({
      success: true,
      users,
      activities,
      errors,
      subscriptions,
      metrics: {
        totalUsers: Number(m.total_users) || users.length,
        totalClients: Number(m.total_clients) || 0,
        totalProviders: Number(m.total_providers) || 0,
        totalRevenue: Number(m.total_revenue) || 0,
        totalActiveAds: Number(m.total_active_ads) || 0,
        totalLogs: Number(m.total_logs) || activities.length,
      },
    });
  } catch (err) {
    console.error('Erreur API Admin Overview:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne de chargement de la console développeur.' });
  }
}

// =====================================================================
// ACTION: delete-user (POST)
// =====================================================================
async function handleDeleteUser(req, res, auth) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId requis.' });
  }

  const pgClient = getPgClient();

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
}

// =====================================================================
// ACTION: extend-sub (POST)
// =====================================================================
async function handleExtendSub(req, res, auth) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  const { subId } = req.body || {};
  if (!subId) {
    return res.status(400).json({ error: 'subId requis.' });
  }

  const pgClient = getPgClient();

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
}

// =====================================================================
// ACTION: toggle-block (POST)
// =====================================================================
async function handleToggleBlock(req, res, auth) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId requis.' });
  }

  const pgClient = getPgClient();

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
}

// =====================================================================
// ROUTEUR PRINCIPAL — Dispatche selon ?action=...
// =====================================================================
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Contrôle d'accès serveur strict Développeur / Superviseur
  const auth = requireAdminAuth(req, res);
  if (!auth.authorized) return;

  const action = (req.query.action || '').toLowerCase();

  switch (action) {
    case 'overview':
      return handleOverview(req, res, auth);
    case 'delete-user':
      return handleDeleteUser(req, res, auth);
    case 'extend-sub':
      return handleExtendSub(req, res, auth);
    case 'toggle-block':
      return handleToggleBlock(req, res, auth);
    default:
      return res.status(400).json({
        error: 'Action admin non reconnue.',
        availableActions: ['overview', 'delete-user', 'extend-sub', 'toggle-block'],
      });
  }
};
