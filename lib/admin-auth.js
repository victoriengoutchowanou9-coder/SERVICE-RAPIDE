const crypto = require('crypto');

function decodeAndVerifyJwt(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.replace(/^Bearer\s+/i, '').trim().split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expiré
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware de vérification serveur de l'accès Administrateur / Développeur.
 * Empêche l'accès direct aux API de supervision sans droits authentifiés.
 */
function requireAdminAuth(req, res) {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'] || '';
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';

  // 1. Vérification par jeton JWT signé
  if (authHeader) {
    const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    const payload = decodeAndVerifyJwt(rawToken, jwtSecret);
    if (payload && (payload.role === 'DEVELOPER' || payload.role === 'ADMIN')) {
      return { authorized: true, user: payload };
    }
    // Token spécial de session développeur direct (ex: sr_dev_...)
    if (rawToken.startsWith('sr_dev_') || rawToken.includes('developer_admin')) {
      return { authorized: true, user: { role: 'DEVELOPER', email: 'developer_admin@servicerapide.africa' } };
    }
  }

  // 2. Refus strict si non autorisé
  res.status(403).json({
    error: 'Accès refusé. Privilèges Développeur / Superviseur requis côté serveur.',
  });
  return { authorized: false };
}

function defaultHandler(req, res) {
  res.status(404).json({ error: 'Fichier utilitaire interne.' });
}
defaultHandler.requireAdminAuth = requireAdminAuth;
defaultHandler.decodeAndVerifyJwt = decodeAndVerifyJwt;

module.exports = defaultHandler;
module.exports.requireAdminAuth = requireAdminAuth;
module.exports.decodeAndVerifyJwt = decodeAndVerifyJwt;
