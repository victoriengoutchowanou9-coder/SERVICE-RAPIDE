const { Client } = require('pg');
const crypto = require('crypto');

// Utilitaire de création de token JWT sécurisé sans dépendance externe
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
  let { emailOrIdentifier, email, identifier, password } = body;
  const rawLogin = (emailOrIdentifier || identifier || email || '').trim();
  const inputPassword = (password || '').trim();

  if (!rawLogin || !inputPassword) {
    return res.status(400).json({ error: 'Identifiant (ou email) et mot de passe requis.' });
  }

  let lookupEmail = rawLogin.toLowerCase();
  if (lookupEmail === 'developer_admin' || lookupEmail === 'developer') {
    lookupEmail = 'developer_admin@servicerapide.africa';
  }

  // Recherche par numéro de téléphone uniquement si la saisie ne contient pas d'arobase
  const isEmailInput = rawLogin.includes('@');
  const cleanDigits = isEmailInput ? '' : rawLogin.replace(/\D/g, '');

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

    // 1. Recherche par email, identifiant ou numéro de téléphone dans auth.users et public.users
    const query = `
      SELECT 
        u.id, 
        u.email, 
        u.role, 
        u.identifier,
        u."firstName", 
        u."lastName", 
        u."phoneNumber", 
        u."countryCode", 
        u.country, 
        u.department, 
        u.commune, 
        u.city, 
        u."clientTrialExpiresAt", 
        u."clientSubscriptionExpiresAt", 
        u."createdAt", 
        u."isActive",
        au.encrypted_password,
        au.email_confirmed_at,
        (au.encrypted_password = crypt($2, au.encrypted_password)) AS auth_pwd_match,
        u."passwordHash"
      FROM auth.users au
      LEFT JOIN public.users u ON u.id = au.id
      WHERE LOWER(au.email) = LOWER($1) 
         OR (u.identifier IS NOT NULL AND LOWER(u.identifier) = LOWER($1))
         OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER($1))
         OR (u."phoneNumber" IS NOT NULL AND length(regexp_replace(u."phoneNumber", '\\D', '', 'g')) >= 6 AND $3 != '' AND (
             u."phoneNumber" = $1
             OR regexp_replace(u."phoneNumber", '\\D', '', 'g') = $3
             OR regexp_replace(u."phoneNumber", '\\D', '', 'g') LIKE '%' || $3
             OR $3 LIKE '%' || regexp_replace(u."phoneNumber", '\\D', '', 'g')
         ))
      LIMIT 1;
    `;

    const result = await pgClient.query(query, [lookupEmail, inputPassword, cleanDigits]);

    if (result.rows.length === 0) {
      // Deuxième tentative : recherche directe dans public.users avec vérification auth.users
      const pubUserRes = await pgClient.query(`
        SELECT u.*, au.email_confirmed_at
        FROM public.users u
        LEFT JOIN auth.users au ON au.id = u.id OR LOWER(au.email) = LOWER(u.email)
        WHERE LOWER(u.email) = LOWER($1) 
           OR (u.identifier IS NOT NULL AND LOWER(u.identifier) = LOWER($1))
           OR ($3 != '' AND length(regexp_replace(u."phoneNumber", '\\D', '', 'g')) >= 6 AND (
               u."phoneNumber" = $1
               OR regexp_replace(u."phoneNumber", '\\D', '', 'g') = $3
               OR regexp_replace(u."phoneNumber", '\\D', '', 'g') LIKE '%' || $3
               OR $3 LIKE '%' || regexp_replace(u."phoneNumber", '\\D', '', 'g')
           ))
        LIMIT 1;
      `, [lookupEmail, cleanDigits]);

      if (pubUserRes.rows.length === 0) {
        await pgClient.end();
        return res.status(401).json({ error: 'Identifiant, email ou mot de passe incorrect.' });
      }

      const pUser = pubUserRes.rows[0];

      // Vérification compte actif
      if (pUser.isActive === false) {
        await pgClient.end();
        return res.status(403).json({ error: "Ce compte a été suspendu par l'administration. Contactez le support." });
      }

      // Vérification du mot de passe avec crypt
      const verifyRes = await pgClient.query(`SELECT (crypt($1, $2) = $2) AS match;`, [inputPassword, pUser.passwordHash || '']);
      if (!verifyRes.rows[0]?.match) {
        await pgClient.end();
        return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      }

      // Contrôle de confirmation d'email obligatoire
      const isDevAdminFallback = (pUser.email && pUser.email.toLowerCase() === 'developer_admin@servicerapide.africa') || pUser.role === 'ADMIN';
      if (!isDevAdminFallback && !pUser.email_confirmed_at) {
        await pgClient.end();
        return res.status(403).json({
          error: "Votre adresse e-mail n'a pas encore été confirmée. Veuillez valider votre e-mail avant de vous connecter.",
          requiresEmailConfirmation: true,
          email: pUser.email,
        });
      }

      const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
      const token = createJwtToken({ sub: pUser.id, email: pUser.email, role: pUser.role }, jwtSecret);

      await pgClient.end();
      return res.status(200).json({
        message: 'Connexion réussie',
        accessToken: token,
        user: {
          id: pUser.id,
          email: pUser.email,
          role: pUser.role,
          identifier: pUser.identifier,
          firstName: pUser.firstName || '',
          lastName: pUser.lastName || '',
          phoneNumber: pUser.phoneNumber || '',
          countryCode: pUser.countryCode || 'BJ',
          country: pUser.country || '',
          department: pUser.department || '',
          commune: pUser.commune || '',
          city: pUser.city || '',
          clientTrialExpiresAt: pUser.clientTrialExpiresAt,
          clientSubscriptionExpiresAt: pUser.clientSubscriptionExpiresAt,
          createdAt: pUser.createdAt,
        },
      });
    }

    const row = result.rows[0];

    // Vérification compte actif
    if (row.isActive === false) {
      await pgClient.end();
      return res.status(403).json({ error: "Ce compte a été suspendu par l'administration. Contactez le support." });
    }

    // Vérification du mot de passe
    let isPasswordValid = row.auth_pwd_match === true;
    if (!isPasswordValid && row.passwordHash) {
      const pHashCheck = await pgClient.query(`SELECT (crypt($1, $2) = $2) AS match;`, [inputPassword, row.passwordHash]);
      if (pHashCheck.rows[0]?.match) {
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      await pgClient.end();
      try {
        const { recordAuditLog } = require('../utils/audit');
        await recordAuditLog({
          eventType: 'AUTH_LOGIN_FAILED',
          actionTitle: `Échec de connexion : mot de passe incorrect (${row.email})`,
          userEmail: row.email,
          userRole: row.role,
          module: 'AUTH',
          resourceType: 'users',
          status: 'FAILURE',
          details: { loginAttempt: rawLogin, reason: 'INVALID_PASSWORD' },
          req,
        });
      } catch {}
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }

    // Contrôle de confirmation d'email obligatoire
    const isDevAdmin = (row.email && row.email.toLowerCase() === 'developer_admin@servicerapide.africa') || row.role === 'ADMIN';
    if (!isDevAdmin && !row.email_confirmed_at) {
      await pgClient.end();
      return res.status(403).json({
        error: "Votre adresse e-mail n'a pas encore été confirmée. Veuillez valider votre e-mail avant de vous connecter.",
        requiresEmailConfirmation: true,
        email: row.email,
      });
    }

    // Profil prestataire éventuel
    const provRes = await pgClient.query(`SELECT * FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;`, [row.id]);
    const providerProfile = provRes.rows[0] || null;

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
    const token = createJwtToken(
      {
        sub: row.id,
        email: row.email,
        role: row.role || 'CLIENT',
      },
      jwtSecret
    );

    await pgClient.end();

    try {
      const { recordAuditLog } = require('../utils/audit');
      await recordAuditLog({
        eventType: 'AUTH_LOGIN',
        actionTitle: `Connexion réussie (${row.role || 'UTILISATEUR'}) : ${row.email}`,
        userEmail: row.email,
        userRole: row.role || 'CLIENT',
        module: 'AUTH',
        resourceType: 'users',
        resourceId: row.id,
        status: 'SUCCESS',
        details: {
          fullName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          country: row.country,
          city: row.city,
        },
        req,
      });
    } catch {}

    return res.status(200).json({
      message: 'Connexion réussie',
      accessToken: token,
      user: {
        id: row.id,
        email: row.email,
        role: row.role || 'CLIENT',
        identifier: row.identifier,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        phoneNumber: row.phoneNumber || '',
        countryCode: row.countryCode || 'BJ',
        country: row.country || '',
        department: row.department || '',
        commune: row.commune || '',
        city: row.city || '',
        clientTrialExpiresAt: row.clientTrialExpiresAt,
        clientSubscriptionExpiresAt: row.clientSubscriptionExpiresAt,
        createdAt: row.createdAt,
        providerProfile,
      },
    });
  } catch (err) {
    console.error('Erreur API Auth Login:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne du serveur lors de la connexion.' });
  }
};
