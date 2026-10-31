const { Client } = require('pg');
const crypto = require('crypto');

// ─── Utilitaires JWT et PG ──────────────────────────────────────────
function verifyJwtToken(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (signatureB64 !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function getAuthUserId(req) {
  const h = req.headers['authorization'] || '';
  if (!h.startsWith('Bearer ')) return null;
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
  const p = verifyJwtToken(h.substring(7).trim(), secret);
  return p?.sub || null;
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

// ─── GET ?action=get ────────────────────────────────────────────────
async function handleGetProfile(req, res, userId) {
  const pg = getPgClient();
  try {
    await pg.connect();
    const uRes = await pg.query('SELECT * FROM public.users WHERE id = $1 LIMIT 1;', [userId]);
    const pRes = await pg.query('SELECT * FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;', [userId]);
    await pg.end();
    if (!uRes.rows[0]) return res.status(404).json({ error: 'Profil non trouvé.' });
    const user = uRes.rows[0];
    const providerProfile = pRes.rows[0] || null;
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        countryCode: user.countryCode || 'BJ',
        country: user.country || '',
        department: user.department || '',
        commune: user.commune || '',
        city: user.city || '',
        avatarUrl: user.avatarUrl || '',
        birthDate: user.birthDate || '',
        clientTrialExpiresAt: user.clientTrialExpiresAt,
        clientSubscriptionExpiresAt: user.clientSubscriptionExpiresAt,
        createdAt: user.createdAt,
        providerProfile,
      },
    });
  } catch (err) {
    console.error('Erreur get profile:', err);
    try { await pg.end(); } catch {}
    return res.status(500).json({ error: 'Erreur interne.' });
  }
}

// ─── POST ?action=choose-role ───────────────────────────────────────
async function handleChooseRole(req, res, userId) {
  const { role, singleName, serviceOffered, city, department, commune, country, phoneNumber, whatsappNumber } = req.body || {};
  if (role !== 'CLIENT' && role !== 'PROVIDER') {
    return res.status(400).json({ error: 'Rôle invalide. Choisissez CLIENT ou PROVIDER.' });
  }
  const pg = getPgClient();
  try {
    await pg.connect();

    // 1. Mettre à jour le rôle dans public.users
    await pg.query(`
      UPDATE public.users
      SET role = $1, country = COALESCE(NULLIF($2,''), country), department = COALESCE(NULLIF($3,''), department),
          commune = COALESCE(NULLIF($4,''), commune), city = COALESCE(NULLIF($5,''), city), "updatedAt" = NOW()
      WHERE id = $6;
    `, [role, country || '', department || '', commune || '', city || '', userId]);

    let providerProfile = null;

    // 2. Si prestataire, créer ou mettre à jour provider_profiles
    if (role === 'PROVIDER') {
      const existRes = await pg.query('SELECT id FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;', [userId]);
      const pPhone = phoneNumber || whatsappNumber || '';

      if (existRes.rows.length > 0) {
        await pg.query(`
          UPDATE public.provider_profiles SET
            "singleName" = COALESCE(NULLIF($2,''), "singleName"),
            "serviceOffered" = COALESCE(NULLIF($3,''), "serviceOffered"),
            country = COALESCE(NULLIF($4,''), country),
            city = COALESCE(NULLIF($5,''), city),
            department = COALESCE(NULLIF($6,''), department),
            commune = COALESCE(NULLIF($7,''), commune),
            "whatsappNumber" = COALESCE(NULLIF($8,''), "whatsappNumber"),
            "directPhoneNumber" = COALESCE(NULLIF($8,''), "directPhoneNumber"),
            availability = 'AVAILABLE',
            "updatedAt" = NOW()
          WHERE "userId" = $1;
        `, [userId, singleName || '', serviceOffered || '', country || '', city || '', department || '', commune || '', pPhone]);
      } else {
        await pg.query(`
          INSERT INTO public.provider_profiles (
            id, "userId", "singleName", "fullName", "serviceOffered", country, department, commune, city,
            "directPhoneNumber", "whatsappNumber", availability, "receivesOnSite", "travelRequired",
            "travelFee", "basePrice", "pricingUnit", "subscriptionExpiresAt", "isTrialUsed", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), $1, $2, $2, $3, $4, $5, $6, $7,
            $8, $8, 'AVAILABLE', true, true,
            1000, 5000, 'PRESTATION', NOW() + INTERVAL '30 days', false, NOW(), NOW()
          );
        `, [userId, singleName || 'Professionnel', serviceOffered || 'Services Généraux',
            country || '', department || '', commune || '', city || '', pPhone]);
      }
      const ppRes = await pg.query('SELECT * FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;', [userId]);
      providerProfile = ppRes.rows[0] || null;
    }

    // 3. Récupérer l'utilisateur mis à jour
    const uRes = await pg.query('SELECT * FROM public.users WHERE id = $1 LIMIT 1;', [userId]);
    await pg.end();
    const user = uRes.rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        countryCode: user.countryCode || 'BJ',
        country: user.country || '',
        department: user.department || '',
        commune: user.commune || '',
        city: user.city || '',
        avatarUrl: user.avatarUrl || '',
        clientTrialExpiresAt: user.clientTrialExpiresAt,
        clientSubscriptionExpiresAt: user.clientSubscriptionExpiresAt,
        createdAt: user.createdAt,
        providerProfile,
      },
    });
  } catch (err) {
    console.error('Erreur choose-role:', err);
    try { await pg.end(); } catch {}
    return res.status(500).json({ error: 'Erreur interne lors du choix du rôle.' });
  }
}

// ─── POST ?action=update-provider ───────────────────────────────────
async function handleUpdateProvider(req, res, userId) {
  const b = req.body || {};
  const pg = getPgClient();
  try {
    await pg.connect();
    const existRes = await pg.query('SELECT id FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;', [userId]);
    if (existRes.rows.length === 0) {
      await pg.end();
      return res.status(404).json({ error: 'Profil prestataire non trouvé. Veuillez d\'abord choisir le rôle prestataire.' });
    }

    // Sérialiser les tableaux JSON
    const portfolioPhotos = JSON.stringify(Array.isArray(b.portfolioPhotos) ? b.portfolioPhotos : []);
    const pricingTiers = JSON.stringify(Array.isArray(b.pricingTiers) ? b.pricingTiers : []);
    const skills = JSON.stringify(Array.isArray(b.skills) ? b.skills : []);
    const interventionZones = JSON.stringify(Array.isArray(b.interventionZones) ? b.interventionZones : []);

    await pg.query(`
      UPDATE public.provider_profiles SET
        "singleName" = COALESCE(NULLIF($2,''), "singleName"),
        "fullName" = COALESCE(NULLIF($3,''), "fullName"),
        "serviceOffered" = COALESCE(NULLIF($4,''), "serviceOffered"),
        country = COALESCE(NULLIF($5,''), country),
        city = COALESCE(NULLIF($6,''), city),
        department = COALESCE(NULLIF($7,''), department),
        commune = COALESCE(NULLIF($8,''), commune),
        "receivesOnSite" = $9,
        "travelRequired" = $10,
        "travelFee" = $11,
        "basePrice" = $12,
        "pricingUnit" = COALESCE(NULLIF($13,''), "pricingUnit"),
        "hourlyRate" = $14,
        "dailyRate" = $15,
        "pricingTiers" = $16::jsonb,
        "portfolioPhotos" = $17::jsonb,
        "whatsappNumber" = COALESCE(NULLIF($18,''), "whatsappNumber"),
        "directPhoneNumber" = COALESCE(NULLIF($19,''), "directPhoneNumber"),
        "photoUrl" = $20,
        skills = $21::jsonb,
        "interventionZones" = $22::jsonb,
        "updatedAt" = NOW()
      WHERE "userId" = $1;
    `, [
      userId,
      b.singleName || '',
      b.fullName || '',
      b.serviceOffered || '',
      b.country || '',
      b.city || '',
      b.department || '',
      b.commune || '',
      Boolean(b.receivesOnSite),
      Boolean(b.travelRequired),
      parseFloat(b.travelFee) || 0,
      parseFloat(b.basePrice) || 5000,
      b.pricingUnit || '',
      b.hourlyRate ? parseFloat(b.hourlyRate) : null,
      b.dailyRate ? parseFloat(b.dailyRate) : null,
      pricingTiers,
      portfolioPhotos,
      b.whatsappNumber || '',
      b.directPhoneNumber || '',
      b.photoUrl || null,
      skills,
      interventionZones,
    ]);

    // Retourner le profil mis à jour
    const ppRes = await pg.query('SELECT * FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;', [userId]);
    await pg.end();

    return res.status(200).json({ providerProfile: ppRes.rows[0] || null });
  } catch (err) {
    console.error('Erreur update-provider:', err);
    try { await pg.end(); } catch {}
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde du profil prestataire.' });
  }
}

// ─── POST ?action=update-client ─────────────────────────────────────
async function handleUpdateClient(req, res, userId) {
  const b = req.body || {};
  const pg = getPgClient();
  try {
    await pg.connect();
    await pg.query(`
      UPDATE public.users SET
        "firstName" = COALESCE(NULLIF($2,''), "firstName"),
        "lastName" = COALESCE(NULLIF($3,''), "lastName"),
        "phoneNumber" = COALESCE(NULLIF($4,''), "phoneNumber"),
        "avatarUrl" = $5,
        "birthDate" = $6,
        country = COALESCE(NULLIF($7,''), country),
        "countryCode" = COALESCE(NULLIF($8,''), "countryCode"),
        department = COALESCE(NULLIF($9,''), department),
        commune = COALESCE(NULLIF($10,''), commune),
        city = COALESCE(NULLIF($11,''), city),
        "updatedAt" = NOW()
      WHERE id = $1;
    `, [
      userId,
      b.firstName || '',
      b.lastName || '',
      b.phoneNumber || '',
      b.avatarUrl || null,
      b.birthDate || null,
      b.country || '',
      b.countryCode || '',
      b.department || '',
      b.commune || '',
      b.city || '',
    ]);

    const uRes = await pg.query('SELECT * FROM public.users WHERE id = $1 LIMIT 1;', [userId]);
    await pg.end();
    const user = uRes.rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        countryCode: user.countryCode || 'BJ',
        country: user.country || '',
        department: user.department || '',
        commune: user.commune || '',
        city: user.city || '',
        avatarUrl: user.avatarUrl || '',
        birthDate: user.birthDate || '',
        clientTrialExpiresAt: user.clientTrialExpiresAt,
        clientSubscriptionExpiresAt: user.clientSubscriptionExpiresAt,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Erreur update-client:', err);
    try { await pg.end(); } catch {}
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde du profil client.' });
  }
}

// ─── ROUTEUR PRINCIPAL ──────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentification requise. Veuillez vous reconnecter.' });
  }

  const action = (req.query.action || '').toLowerCase();
  switch (action) {
    case 'get':           return handleGetProfile(req, res, userId);
    case 'choose-role':   return handleChooseRole(req, res, userId);
    case 'update-provider': return handleUpdateProvider(req, res, userId);
    case 'update-client': return handleUpdateClient(req, res, userId);
    default:
      return res.status(400).json({
        error: 'Action profil non reconnue.',
        availableActions: ['get', 'choose-role', 'update-provider', 'update-client'],
      });
  }
};
