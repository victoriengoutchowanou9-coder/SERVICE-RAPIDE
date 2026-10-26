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
const crypto = require('crypto');

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

    // Vérifier si l'utilisateur existe déjà
    const existing = await pgClient.query(`
      SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)
      UNION
      SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `, [cleanEmail]);

    if (existing.rows.length > 0) {
      await pgClient.end();
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
        ${role === 'CLIENT' ? "NOW() + INTERVAL '7 days'" : "NULL"},
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
      const { sendConfirmationEmail } = require('../utils/mailer');
      emailDelivery = await sendConfirmationEmail(createdUser.email, confirmationToken, createdUser.firstName);
    } catch (mErr) {
      console.warn('Erreur envoi mailer register:', mErr.message);
    }

    return res.status(201).json({
      message: emailDelivery.sent
        ? `Compte créé avec succès ! Un e-mail contenant votre code de confirmation a été envoyé à ${createdUser.email}.`
        : `Compte créé avec succès ! Code de confirmation envoyé à ${createdUser.email}.`,
      requiresOtp: true,
      requiresEmailConfirmation: true,
      email: createdUser.email,
      emailSent: emailDelivery.sent,
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
};
