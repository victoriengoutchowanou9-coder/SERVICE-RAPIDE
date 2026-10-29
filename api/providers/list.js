const { Client } = require('pg');
const crypto = require('crypto');

// Utilitaire de vérification du token JWT
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
    const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
  return verifyJwtToken(token, jwtSecret);
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const client = getPgClient();

  try {
    await client.connect();

    // Vérifier l'utilisateur connecté pour déterminer ses déblocages payés
    const authUser = getAuthenticatedUser(req);
    let unlockedIds = new Set();

    if (authUser && authUser.sub) {
      const unlocksRes = await client.query(
        'SELECT "providerId" FROM public.contact_unlocks WHERE "clientId" = $1;',
        [authUser.sub]
      );
      unlockedIds = new Set(unlocksRes.rows.map((r) => r.providerId));
    }

    // Récupération de tous les prestataires enregistrés
    const provRes = await client.query(`
      SELECT 
        p.*,
        u."firstName",
        u."lastName"
      FROM public.provider_profiles p
      LEFT JOIN public.users u ON p."userId" = u.id
      ORDER BY 
        CASE WHEN p.availability = 'AVAILABLE' THEN 0 ELSE 1 END,
        p."createdAt" DESC;
    `);

    await client.end();

    const formattedProviders = provRes.rows.map((row) => {
      const isUnlocked = unlockedIds.has(row.id);
      let portfolio = [];
      if (Array.isArray(row.portfolioPhotos)) {
        portfolio = row.portfolioPhotos;
      } else if (typeof row.portfolioPhotos === 'string') {
        try { portfolio = JSON.parse(row.portfolioPhotos); } catch { portfolio = []; }
      }

      let pricingTiers = [];
      if (Array.isArray(row.pricingTiers)) {
        pricingTiers = row.pricingTiers;
      } else if (typeof row.pricingTiers === 'string') {
        try { pricingTiers = JSON.parse(row.pricingTiers); } catch { pricingTiers = []; }
      }

      return {
        id: row.id,
        singleName: row.singleName || 'Professionnel',
        serviceOffered: row.serviceOffered || 'Services Généraux',
        photoUrl: row.photoUrl || null,
        portfolioPhotos: Array.isArray(portfolio) ? portfolio : [],
        city: row.city || 'Cotonou',
        department: row.department || '',
        commune: row.commune || '',
        country: row.country || 'Bénin',
        availability: row.availability || 'AVAILABLE',
        receivesOnSite: Boolean(row.receivesOnSite),
        travelRequired: Boolean(row.travelRequired),
        travelFee: parseFloat(row.travelFee) || 0,
        basePrice: parseFloat(row.basePrice) || 5000,
        pricingUnit: row.pricingUnit || 'PRESTATION',
        hourlyRate: row.hourlyRate ? parseFloat(row.hourlyRate) : null,
        dailyRate: row.dailyRate ? parseFloat(row.dailyRate) : null,
        pricingTiers: Array.isArray(pricingTiers) ? pricingTiers : [],
        rating: 4.9,
        reviewsCount: 14,
        completedMissions: 28,
        isContactUnlocked: isUnlocked,
        unlockId: isUnlocked ? 'unlocked' : null,
        refundStatus: null,
        // RÈGLE CRITIQUE : Coordonnées masquées tant que non débloqué
        contact: {
          fullName: isUnlocked ? row.fullName || `${row.firstName || ''} ${row.lastName || ''}`.trim() : row.singleName,
          directPhone: isUnlocked ? row.directPhoneNumber || '' : '',
          whatsappNumber: isUnlocked ? row.whatsappNumber || '' : '',
        },
      };
    });

    return res.status(200).json(formattedProviders);
  } catch (error) {
    console.error('Erreur API providers/list:', error);
    try { await client.end(); } catch {}
    return res.status(500).json({ error: 'Erreur lors de la récupération des prestataires.' });
  }
};
