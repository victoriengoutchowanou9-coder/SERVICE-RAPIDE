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
// ACTION: login (POST)
// =====================================================================
async function handleLogin(req, res) {
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

  const pgClient = getPgClient();

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
        const { recordAuditLog } = require('../lib/audit');
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
      const { recordAuditLog } = require('../lib/audit');
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
}

// =====================================================================
// ACTION: register (POST)
// =====================================================================
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const body = req.body || {};
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    role = 'CLIENT',
    country,
    countryCode = 'BJ',
    department,
    commune,
    city,
    serviceOffered,
  } = body;

  const cleanEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Format d\'adresse email invalide.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'Le nom et le prénom sont obligatoires.' });
  }

  const pgClient = getPgClient();

  try {
    await pgClient.connect();

    // Vérifier si l'utilisateur existe déjà
    const existing = await pgClient.query(`
      SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)
      UNION
      SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `, [cleanEmail]);

    if (existing.rows.length > 0) {
      await pgClient.end();
      try {
        const { recordAuditLog } = require('../lib/audit');
        await recordAuditLog({
          eventType: 'USER_REGISTER_FAILED',
          actionTitle: `Tentative d'inscription refusée : email déjà existant (${cleanEmail})`,
          userEmail: cleanEmail,
          module: 'AUTH',
          resourceType: 'users',
          status: 'FAILURE',
          details: { reason: 'EMAIL_ALREADY_EXISTS' },
          req,
        });
      } catch {}
      return res.status(409).json({ error: 'Un compte existe déjà avec cette adresse email.' });
    }

    // Création UUID
    const userIdRes = await pgClient.query(`SELECT gen_random_uuid() AS id;`);
    const newUserId = userIdRes.rows[0].id;

    // Génération du code de confirmation à 6 chiffres
    const confirmationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Insertion dans auth.users avec validation d'email requise (email_confirmed_at = NULL)
    try {
      await pgClient.query(`
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          confirmation_token,
          confirmation_sent_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          aud,
          role
        ) VALUES (
          $1,
          '00000000-0000-0000-0000-000000000000',
          $2,
          crypt($3, gen_salt('bf')),
          NULL,
          $4,
          NOW(),
          '{"provider":"email","providers":["email"]}',
          json_build_object('firstName', $5::text, 'lastName', $6::text, 'role', $7::text),
          NOW(),
          NOW(),
          'authenticated',
          'authenticated'
        );
      `, [newUserId, cleanEmail, password, confirmationToken, firstName.trim(), lastName.trim(), role]);
    } catch (authErr) {
      console.warn('Note auth.users insert:', authErr.message);
    }

    // 2. Insertion / Mise à jour dans public.users (avec ON CONFLICT pour gérer le trigger Supabase)
    const userUpsertQuery = `
      INSERT INTO public.users (
        id,
        email,
        "passwordHash",
        role,
        "firstName",
        "lastName",
        "phoneNumber",
        "countryCode",
        country,
        department,
        commune,
        city,
        "isActive",
        "clientTrialExpiresAt",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1,
        $2,
        crypt($3, gen_salt('bf')),
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        true,
        NULL,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        "phoneNumber" = EXCLUDED."phoneNumber",
        "countryCode" = EXCLUDED."countryCode",
        country = EXCLUDED.country,
        department = EXCLUDED.department,
        commune = EXCLUDED.commune,
        city = EXCLUDED.city,
        role = EXCLUDED.role,
        "clientTrialExpiresAt" = EXCLUDED."clientTrialExpiresAt",
        "updatedAt" = NOW()
      RETURNING *;
    `;

    const userRes = await pgClient.query(userUpsertQuery, [
      newUserId,
      cleanEmail,
      password,
      role,
      firstName.trim(),
      lastName.trim(),
      phoneNumber || '',
      countryCode || 'BJ',
      country || '',
      department || '',
      commune || '',
      city || '',
    ]);

    const createdUser = userRes.rows[0];
    let createdProviderProfile = null;

    // 3. Si prestataire, créer le profil initial
    if (role === 'PROVIDER') {
      try {
        const provRes = await pgClient.query(`
          INSERT INTO public.provider_profiles (
            id,
            "userId",
            "singleName",
            "fullName",
            "serviceOffered",
            country,
            department,
            commune,
            city,
            "directPhoneNumber",
            "whatsappNumber",
            availability,
            "receivesOnSite",
            "travelRequired",
            "travelFee",
            "basePrice",
            "pricingUnit",
            "subscriptionExpiresAt",
            "isTrialUsed",
            "createdAt",
            "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $9,
            'AVAILABLE',
            true,
            true,
            1000,
            5000,
            'PRESTATION',
            NOW() + INTERVAL '30 days',
            false,
            NOW(),
            NOW()
          )
          RETURNING *;
        `, [
          newUserId,
          `${firstName.trim()}`,
          `${firstName.trim()} ${lastName.trim()}`,
          serviceOffered || 'Services Généraux',
          country || '',
          department || '',
          commune || '',
          city || '',
          phoneNumber || '',
        ]);
        createdProviderProfile = provRes.rows[0];
      } catch (provErr) {
        console.warn('Note provider_profile insert:', provErr.message);
      }
    }

    await pgClient.end();

    // Envoi effectif de l'e-mail de confirmation à l'utilisateur
    let emailDelivery = { sent: false };
    try {
      const { sendConfirmationEmail } = require('../lib/mailer');
      emailDelivery = await sendConfirmationEmail(createdUser.email, confirmationToken, createdUser.firstName);
    } catch (mErr) {
      console.warn('Erreur envoi mailer register:', mErr.message);
    }

    // Journalisation d'audit réelle dans Supabase system_audit_logs
    try {
      const { recordAuditLog } = require('../lib/audit');
      await recordAuditLog({
        eventType: 'USER_REGISTER',
        actionTitle: `Inscription réussie d'un nouveau compte ${role === 'PROVIDER' ? 'Prestataire' : 'Client'} (${createdUser.email})`,
        userEmail: createdUser.email,
        userRole: role,
        module: 'AUTH',
        resourceType: 'users',
        resourceId: createdUser.id,
        status: 'SUCCESS',
        details: {
          fullName: `${createdUser.firstName} ${createdUser.lastName}`,
          country: createdUser.country,
          city: createdUser.city,
          emailDeliverySent: emailDelivery.sent,
        },
        req,
      });
    } catch (auditErr) {
      console.warn('Erreur audit register:', auditErr.message);
    }

    const message = emailDelivery.sent
      ? `Compte créé avec succès ! Un e-mail contenant votre code de confirmation a été envoyé à ${createdUser.email}.`
      : `Compte créé avec succès ! Le code de confirmation à 6 chiffres a été préparé pour ${createdUser.email}. Si vous ne le recevez pas, vérifiez vos spams ou demandez un renvoi.`;

    return res.status(201).json({
      message,
      requiresOtp: true,
      requiresEmailConfirmation: true,
      email: createdUser.email,
      emailSent: emailDelivery.sent,
      devCode: !emailDelivery.sent ? confirmationToken : undefined,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        phoneNumber: createdUser.phoneNumber,
        country: createdUser.country,
        countryCode: createdUser.countryCode,
        department: createdUser.department,
        commune: createdUser.commune,
        city: createdUser.city,
        clientTrialExpiresAt: createdUser.clientTrialExpiresAt,
        clientSubscriptionExpiresAt: createdUser.clientSubscriptionExpiresAt,
        createdAt: createdUser.createdAt,
        providerProfile: createdProviderProfile,
      },
    });
  } catch (err) {
    console.error('Erreur API Auth Register:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors de la création du compte.' });
  }
}

// =====================================================================
// ACTION: confirm-email (POST)
// =====================================================================
async function handleConfirmEmail(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const body = req.body || {};
  const { email, token, code, otp } = body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const inputCode = (token || code || otp || '').toString().trim();

  if (!cleanEmail || !inputCode) {
    return res.status(400).json({ error: 'Email et code de confirmation requis.' });
  }

  const pgClient = getPgClient();

  try {
    await pgClient.connect();

    // 1. Recherche du compte dans auth.users
    const userRes = await pgClient.query(`
      SELECT id, email, confirmation_token, email_confirmed_at
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
      const pubUserRes = await pgClient.query(`SELECT * FROM public.users WHERE id = $1 LIMIT 1;`, [authUser.id]);
      const pubUser = pubUserRes.rows[0] || {};
      const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
      const accessToken = createJwtToken({ sub: authUser.id, email: authUser.email, role: pubUser.role || 'CLIENT' }, jwtSecret);

      await pgClient.end();
      return res.status(200).json({
        message: 'Votre adresse e-mail est déjà confirmée.',
        accessToken,
        user: pubUser,
      });
    }

    // 2. Vérification du code
    if (!authUser.confirmation_token || authUser.confirmation_token !== inputCode) {
      await pgClient.end();
      try {
        const { recordAuditLog } = require('../lib/audit');
        await recordAuditLog({
          eventType: 'EMAIL_CONFIRM_FAILED',
          actionTitle: `Échec confirmation e-mail : code incorrect ou expiré (${cleanEmail})`,
          userEmail: cleanEmail,
          module: 'AUTH',
          resourceType: 'users',
          status: 'FAILURE',
          details: { reason: 'INVALID_TOKEN' },
          req,
        });
      } catch {}
      return res.status(400).json({ error: 'Code de confirmation incorrect ou expiré.' });
    }

    // 3. Validation de l'adresse email
    await pgClient.query(`
      UPDATE auth.users
      SET email_confirmed_at = NOW(),
          confirmation_token = NULL,
          updated_at = NOW()
      WHERE id = $1;
    `, [authUser.id]);

    // Récupérer le profil public
    const pubRes = await pgClient.query(`SELECT * FROM public.users WHERE id = $1 LIMIT 1;`, [authUser.id]);
    const pubUser = pubRes.rows[0] || {};

    const provRes = await pgClient.query(`SELECT * FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;`, [authUser.id]);
    const providerProfile = provRes.rows[0] || null;

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
    const accessToken = createJwtToken(
      { sub: authUser.id, email: authUser.email, role: pubUser.role || 'CLIENT' },
      jwtSecret
    );

    await pgClient.end();

    try {
      const { recordAuditLog } = require('../lib/audit');
      await recordAuditLog({
        eventType: 'EMAIL_CONFIRMED',
        actionTitle: `Adresse e-mail confirmée et validée avec succès (${cleanEmail})`,
        userEmail: cleanEmail,
        userRole: pubUser.role || 'CLIENT',
        module: 'AUTH',
        resourceType: 'users',
        resourceId: authUser.id,
        status: 'SUCCESS',
        details: { method: 'EMAIL_OTP_VERIFIED' },
        req,
      });
    } catch {}

    return res.status(200).json({
      message: 'Adresse e-mail confirmée avec succès ! Votre compte est activé.',
      accessToken,
      user: {
        ...pubUser,
        providerProfile,
      },
    });
  } catch (err) {
    console.error('Erreur API Confirm Email:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors de la confirmation de l\'e-mail.' });
  }
}

// =====================================================================
// ACTION: forgot-password (POST)
// =====================================================================
async function handleForgotPassword(req, res) {
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

  const pgClient = getPgClient();

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

    // Envoi effectif de l'e-mail de réinitialisation
    let emailDelivery = { sent: false };
    try {
      const { sendPasswordResetEmail } = require('../lib/mailer');
      emailDelivery = await sendPasswordResetEmail(authUser.email, recoveryCode);
    } catch (mErr) {
      console.warn('Erreur envoi mailer forgot:', mErr.message);
    }

    try {
      const { recordAuditLog } = require('../lib/audit');
      await recordAuditLog({
        eventType: 'PASSWORD_RESET_REQUESTED',
        actionTitle: `Demande de code de réinitialisation de mot de passe (${authUser.email})`,
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
      ? `Un code de réinitialisation à 6 chiffres a été envoyé à votre adresse email (${authUser.email}).`
      : `Demande de réinitialisation enregistrée pour ${authUser.email}. Si vous ne recevez rien après quelques instants, vérifiez vos spams ou réessayez.`;

    return res.status(200).json({
      message,
      email: authUser.email,
      emailSent: emailDelivery.sent,
      devCode: !emailDelivery.sent ? recoveryCode : undefined,
    });
  } catch (err) {
    console.error('Erreur API Forgot Password:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors de la demande de réinitialisation.' });
  }
}

// =====================================================================
// ACTION: resend-confirmation (POST)
// =====================================================================
async function handleResendConfirmation(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const body = req.body || {};
  const { email } = body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Adresse e-mail requise.' });
  }

  const pgClient = getPgClient();

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
      const { sendConfirmationEmail } = require('../lib/mailer');
      emailDelivery = await sendConfirmationEmail(authUser.email, newToken);
    } catch (mErr) {
      console.warn('Erreur envoi mailer resend:', mErr.message);
    }

    try {
      const { recordAuditLog } = require('../lib/audit');
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
}

// =====================================================================
// ACTION: reset-password (POST)
// =====================================================================
async function handleResetPassword(req, res) {
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

  const pgClient = getPgClient();

  try {
    await pgClient.connect();

    let lookupEmail = cleanEmail;
    if (lookupEmail === 'developer_admin' || lookupEmail === 'developer') {
      lookupEmail = 'developer_admin@servicerapide.africa';
    }
    const cleanDigits = cleanEmail.replace(/\D/g, '');

    // 1. Recherche du compte et vérification du code
    const userRes = await pgClient.query(`
      SELECT au.id, au.email, au.recovery_token, au.recovery_sent_at, u.identifier
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
      return res.status(404).json({ error: 'Aucun compte associé à cette adresse e-mail.' });
    }

    const authUser = userRes.rows[0];

    // Vérification de validité du code
    if (!authUser.recovery_token || authUser.recovery_token !== inputCode) {
      await pgClient.end();
      try {
        const { recordAuditLog } = require('../lib/audit');
        await recordAuditLog({
          eventType: 'PASSWORD_RESET_FAILED',
          actionTitle: `Échec réinitialisation mot de passe : code incorrect (${authUser.email})`,
          userEmail: authUser.email,
          module: 'AUTH',
          resourceType: 'users',
          status: 'FAILURE',
          details: { reason: 'INVALID_CODE' },
          req,
        });
      } catch {}
      return res.status(400).json({ error: 'Code de réinitialisation incorrect ou expiré.' });
    }

    // Vérification expiration (code valide pendant 30 minutes)
    if (authUser.recovery_sent_at) {
      const elapsedMinutes = (Date.now() - new Date(authUser.recovery_sent_at).getTime()) / (1000 * 60);
      if (elapsedMinutes > 30) {
        await pgClient.end();
        try {
          const { recordAuditLog } = require('../lib/audit');
          await recordAuditLog({
            eventType: 'PASSWORD_RESET_FAILED',
            actionTitle: `Échec réinitialisation mot de passe : code expiré (${authUser.email})`,
            userEmail: authUser.email,
            module: 'AUTH',
            resourceType: 'users',
            status: 'FAILURE',
            details: { reason: 'CODE_EXPIRED' },
            req,
          });
        } catch {}
        return res.status(400).json({ error: 'Ce code a expiré (durée de validité : 30 minutes). Veuillez en demander un nouveau.' });
      }
    }

    // 2. Mise à jour sécurisée du mot de passe dans auth.users
    await pgClient.query(`
      UPDATE auth.users
      SET encrypted_password = crypt($1, gen_salt('bf')),
          recovery_token = NULL,
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
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

    // 4. Journal d'audit de sécurité
    try {
      const { recordAuditLog } = require('../lib/audit');
      await recordAuditLog({
        eventType: 'PASSWORD_RESET_SUCCESS',
        actionTitle: `Mot de passe réinitialisé avec succès (${authUser.email})`,
        userEmail: authUser.email,
        module: 'AUTH',
        resourceType: 'users',
        resourceId: authUser.id,
        status: 'SUCCESS',
        details: { method: 'RECOVERY_CODE_VALIDATED' },
        req,
      });
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.',
    });
  } catch (err) {
    console.error('Erreur API Reset Password:', err);
    try { await pgClient.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne lors de la réinitialisation du mot de passe.' });
  }
}

// =====================================================================
// ROUTEUR PRINCIPAL — Dispatche selon ?action=...
// =====================================================================
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query.action || '').toLowerCase();

  switch (action) {
    case 'login':
      return handleLogin(req, res);
    case 'register':
      return handleRegister(req, res);
    case 'confirm-email':
      return handleConfirmEmail(req, res);
    case 'forgot-password':
      return handleForgotPassword(req, res);
    case 'resend-confirmation':
      return handleResendConfirmation(req, res);
    case 'reset-password':
      return handleResetPassword(req, res);
    default:
      return res.status(400).json({
        error: 'Action auth non reconnue.',
        availableActions: ['login', 'register', 'confirm-email', 'forgot-password', 'resend-confirmation', 'reset-password'],
      });
  }
};
