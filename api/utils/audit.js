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

function getDbClient() {
  return new Client({
    host: process.env.DB_HOST || 'aws-0-eu-west-1.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '6543'),
    user: process.env.DB_USERNAME || 'postgres.gsgbvoyddagpjldgeyqk',
    password: process.env.DB_PASSWORD || 'BI6PbBYPGqNFppwx',
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });
}

/**
 * Enregistre un événement dans la table system_audit_logs de Supabase.
 * Ne journalise JAMAIS de mot de passe, secret ou token.
 */
async function recordAuditLog(event) {
  const {
    eventType,
    actionTitle,
    userEmail,
    userRole,
    module = 'AUTH',
    resourceType,
    resourceId,
    status = 'SUCCESS', // 'SUCCESS' | 'FAILURE'
    details = {},
    req,
  } = event;

  // Filtrer les données sensibles
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.password;
  delete sanitizedDetails.newPassword;
  delete sanitizedDetails.oldPassword;
  delete sanitizedDetails.passwordHash;
  delete sanitizedDetails.secret;
  delete sanitizedDetails.token;

  let ip = event.ipAddress;
  if (!ip && req) {
    ip =
      req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers?.['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
  }

  const client = getDbClient();
  try {
    await client.connect();
    await client.query(`
      INSERT INTO public.system_audit_logs (
        event_type,
        action_title,
        user_email,
        user_role,
        module,
        resource_type,
        resource_id,
        status,
        details,
        ip_address,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW());
    `, [
      eventType || 'ACTIVITE',
      actionTitle || 'Opération système',
      userEmail || null,
      userRole || null,
      module,
      resourceType || null,
      resourceId ? String(resourceId) : null,
      status,
      JSON.stringify(sanitizedDetails),
      ip || null,
    ]);
  } catch (err) {
    console.error('[AUDIT] Erreur enregistrement system_audit_logs:', err.message);
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

module.exports = {
  recordAuditLog,
  getDbClient,
};
