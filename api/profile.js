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
        avatarUrl: user.avatarUrl || providerProfile?.photoUrl || '',
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
        avatarUrl: user.avatarUrl || providerProfile?.photoUrl || '',
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
// Requête DYNAMIQUE : ne met à jour QUE les champs envoyés dans le body.
// Cela évite d'écraser les photos/données existantes lors d'un changement partiel.
async function handleUpdateProvider(req, res, userId) {
  const b = req.body || {};
  const pg = getPgClient();
  try {
    await pg.connect();
    const existRes = await pg.query('SELECT id FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;', [userId]);
    
    // Si le profil prestataire n'existe pas encore, le créer d'abord (UPSERT)
    if (existRes.rows.length === 0) {
      await pg.query(`
        INSERT INTO public.provider_profiles (
          id, "userId", "singleName", "fullName", "serviceOffered", country, department, commune, city,
          "directPhoneNumber", "whatsappNumber", availability, "receivesOnSite", "travelRequired",
          "travelFee", "basePrice", "pricingUnit", "subscriptionExpiresAt", "isTrialUsed", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $2, $3, $4, $5, $6, $7,
          $8, $8, 'AVAILABLE'::availability_status_enum, true, false,
          0, 5000, 'par prestation', NOW() + INTERVAL '30 days', false, NOW(), NOW()
        );
      `, [
        userId,
        b.singleName || 'Professionnel',
        b.serviceOffered || 'Services Généraux',
        b.country || 'Bénin',
        b.department || '',
        b.commune || '',
        b.city || '',
        b.directPhoneNumber || b.whatsappNumber || '',
      ]);
    }

    // Construction dynamique de la clause SET
    const setClauses = [];
    const values = [userId]; // $1 = userId
    let idx = 2;

    const addText = (col, val) => {
      if (val !== undefined && val !== null) {
        setClauses.push(`"${col}" = COALESCE(NULLIF($${idx},''), "${col}")`);
        values.push(String(val));
        idx++;
      }
    };
    const addRaw = (col, val) => {
      if (val !== undefined) {
        setClauses.push(`"${col}" = $${idx}`);
        values.push(val);
        idx++;
      }
    };
    const addJsonb = (col, val) => {
      if (val !== undefined) {
        setClauses.push(`"${col}" = $${idx}::jsonb`);
        values.push(JSON.stringify(Array.isArray(val) ? val : []));
        idx++;
      }
    };

    // Champs texte (COALESCE pour ne pas écraser si vide)
    addText('singleName', b.singleName);
    addText('fullName', b.fullName);
    addText('serviceOffered', b.serviceOffered);
    addText('country', b.country);
    addText('city', b.city);
    addText('department', b.department);
    addText('commune', b.commune);
    addText('pricingUnit', b.pricingUnit);
    addText('whatsappNumber', b.whatsappNumber);
    addText('directPhoneNumber', b.directPhoneNumber);

    // Champs booléens/numériques (seulement si explicitement fournis)
    if (b.receivesOnSite !== undefined) addRaw('receivesOnSite', Boolean(b.receivesOnSite));
    if (b.travelRequired !== undefined) addRaw('travelRequired', Boolean(b.travelRequired));
    if (b.travelFee !== undefined) addRaw('travelFee', parseFloat(b.travelFee) || 0);
    if (b.basePrice !== undefined) addRaw('basePrice', parseFloat(b.basePrice) || 5000);
    if (b.hourlyRate !== undefined) addRaw('hourlyRate', b.hourlyRate ? parseFloat(b.hourlyRate) : null);
    if (b.dailyRate !== undefined) addRaw('dailyRate', b.dailyRate ? parseFloat(b.dailyRate) : null);

    // Disponibilité (enum PostgreSQL availability_status_enum)
    if (b.availability === 'AVAILABLE' || b.availability === 'BUSY') {
      setClauses.push(`"availability" = $${idx}::availability_status_enum`);
      values.push(b.availability);
      idx++;
    }

    // Photo de profil (seulement si fournie — ne PAS écraser avec null)
    if (b.photoUrl !== undefined && b.photoUrl !== null) {
      addRaw('photoUrl', b.photoUrl);
      // Synchroniser avec public.users.avatarUrl pour que le menu et profil soient cohérents
      try {
        await pg.query('UPDATE public.users SET "avatarUrl" = $1, "updatedAt" = NOW() WHERE id = $2;', [b.photoUrl, userId]);
      } catch (uErr) {
        console.warn('Sync avatarUrl to users warn:', uErr.message);
      }
    }

    // Synchronisation nom avec public.users
    if (b.fullName || b.singleName) {
      try {
        const sName = b.singleName || (b.fullName ? b.fullName.split(' ')[0] : '');
        const lName = b.fullName && b.fullName.includes(' ') ? b.fullName.split(' ').slice(1).join(' ') : '';
        await pg.query(`
          UPDATE public.users SET
            "firstName" = COALESCE(NULLIF($1, ''), "firstName"),
            "lastName" = COALESCE(NULLIF($2, ''), "lastName"),
            "updatedAt" = NOW()
          WHERE id = $3;
        `, [sName, lName, userId]);
      } catch (nErr) {
        console.warn('Sync names to users warn:', nErr.message);
      }
    }

    // Tableaux JSONB (seulement si explicitement fournis dans le body)
    if (b.portfolioPhotos !== undefined) addJsonb('portfolioPhotos', b.portfolioPhotos);
    if (b.pricingTiers !== undefined) addJsonb('pricingTiers', b.pricingTiers);
    if (b.skills !== undefined) addJsonb('skills', b.skills);
    if (b.interventionZones !== undefined) addJsonb('interventionZones', b.interventionZones);

    if (setClauses.length === 0) {
      await pg.end();
      return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
    }

    setClauses.push('"updatedAt" = NOW()');
    const sql = `UPDATE public.provider_profiles SET ${setClauses.join(', ')} WHERE "userId" = $1;`;
    await pg.query(sql, values);

    // Retourner le profil complet mis à jour
    const ppRes = await pg.query('SELECT * FROM public.provider_profiles WHERE "userId" = $1 LIMIT 1;', [userId]);
    await pg.end();

    return res.status(200).json({ providerProfile: ppRes.rows[0] || null });
  } catch (err) {
    console.error('Erreur update-provider:', err);
    try { await pg.end(); } catch {}
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde du profil prestataire : ' + err.message });
  }
}

// ─── POST ?action=update-availability ───────────────────────────────
// Endpoint dédié pour changer uniquement la disponibilité (sans toucher au reste)
async function handleUpdateAvailability(req, res, userId) {
  const { availability } = req.body || {};
  if (availability !== 'AVAILABLE' && availability !== 'BUSY') {
    return res.status(400).json({ error: 'Valeur invalide. Utilisez AVAILABLE ou BUSY.' });
  }
  const pg = getPgClient();
  try {
    await pg.connect();
    await pg.query('UPDATE public.provider_profiles SET availability = $1::availability_status_enum, "updatedAt" = NOW() WHERE "userId" = $2;', [availability, userId]);
    await pg.end();
    return res.status(200).json({ availability });
  } catch (err) {
    console.error('Erreur update-availability:', err);
    try { await pg.end(); } catch {}
    return res.status(500).json({ error: 'Erreur lors du changement de disponibilité.' });
  }
}

// ─── POST ?action=update-client ─────────────────────────────────────
// Requête DYNAMIQUE : ne met à jour QUE les champs envoyés dans le body.
async function handleUpdateClient(req, res, userId) {
  const b = req.body || {};
  const pg = getPgClient();
  try {
    await pg.connect();

    // Construction dynamique de la clause SET
    const setClauses = [];
    const values = [userId]; // $1 = userId
    let idx = 2;

    const addText = (col, val) => {
      if (val !== undefined && val !== null) {
        setClauses.push(`"${col}" = COALESCE(NULLIF($${idx},''), "${col}")`);
        values.push(String(val));
        idx++;
      }
    };
    const addRaw = (col, val) => {
      if (val !== undefined) {
        setClauses.push(`"${col}" = $${idx}`);
        values.push(val);
        idx++;
      }
    };

    addText('firstName', b.firstName);
    addText('lastName', b.lastName);
    addText('phoneNumber', b.phoneNumber);
    addText('country', b.country);
    addText('countryCode', b.countryCode);
    addText('department', b.department);
    addText('commune', b.commune);
    addText('city', b.city);

    // Avatar : seulement si explicitement fourni et non null
    if (b.avatarUrl !== undefined && b.avatarUrl !== null) {
      addRaw('avatarUrl', b.avatarUrl);
    }
    // Date de naissance
    if (b.birthDate !== undefined) {
      addRaw('birthDate', b.birthDate || null);
    }

    if (setClauses.length === 0) {
      await pg.end();
      return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
    }

    setClauses.push('"updatedAt" = NOW()');
    const sql = `UPDATE public.users SET ${setClauses.join(', ')} WHERE id = $1;`;
    await pg.query(sql, values);

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
        avatarUrl: user.avatarUrl || providerProfile?.photoUrl || '',
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
    case 'get':                return handleGetProfile(req, res, userId);
    case 'choose-role':        return handleChooseRole(req, res, userId);
    case 'update-provider':    return handleUpdateProvider(req, res, userId);
    case 'update-availability': return handleUpdateAvailability(req, res, userId);
    case 'update-client':      return handleUpdateClient(req, res, userId);
    default:
      return res.status(400).json({
        error: 'Action profil non reconnue.',
        availableActions: ['get', 'choose-role', 'update-provider', 'update-availability', 'update-client'],
      });
  }
};
