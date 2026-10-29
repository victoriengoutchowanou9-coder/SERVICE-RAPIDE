const { Client } = require('pg');
const crypto = require('crypto');
const https = require('https');

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
      return null; // Expiré
    }
    return payload;
  } catch {
    return null;
  }
}

// Extraction du token Bearer
function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_service_rapide_afrique_2025_secure';
  return verifyJwtToken(token, jwtSecret);
}

// Client Postgres réutilisable
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getPgClient();

  try {
    await client.connect();

    // =========================================================================
    // 1. GET : Récupération des publicités
    // =========================================================================
    if (req.method === 'GET') {
      const { scope = 'public', id } = req.query || {};

      if (id) {
        // Détail d'une publicité
        const singleRes = await client.query('SELECT * FROM public.advertisements WHERE id = $1 LIMIT 1;', [id]);
        await client.end();
        if (singleRes.rows.length === 0) return res.status(404).json({ error: 'Publicité non trouvée.' });
        return res.status(200).json(singleRes.rows[0]);
      }

      if (scope === 'mine') {
        const authUser = getAuthenticatedUser(req);
        if (!authUser || !authUser.sub) {
          await client.end();
          return res.status(401).json({ error: 'Authentification requise pour voir vos annonces.' });
        }

        const mineRes = await client.query(`
          SELECT * FROM public.advertisements 
          WHERE "userId" = $1 
          ORDER BY "createdAt" DESC;
        `, [authUser.sub]);

        await client.end();
        return res.status(200).json(mineRes.rows);
      }

      // Par défaut : flux public (UNIQUEMENT les annonces ACTIVES, payées et non expirées)
      const publicRes = await client.query(`
        SELECT 
          id, title, content, "imageUrl", "targetUrl", "targetCountryCode", 
          advertiser, tag, "durationWeeks", "amountPaid", status, "startDate", "endDate"
        FROM public.advertisements
        WHERE status = 'ACTIVE' 
          AND "isActive" = true 
          AND ("endDate" IS NULL OR "endDate" > NOW())
        ORDER BY "createdAt" DESC;
      `);

      await client.end();
      return res.status(200).json(publicRes.rows);
    }

    // =========================================================================
    // 2. POST : Création d'une nouvelle publicité (EN ATTENTE DE PAIEMENT)
    // =========================================================================
    if (req.method === 'POST') {
      const authUser = getAuthenticatedUser(req);
      if (!authUser || !authUser.sub) {
        await client.end();
        return res.status(401).json({ error: 'Authentification requise pour créer une publicité.' });
      }

      const {
        title,
        content,
        imageUrl,
        targetUrl,
        advertiser,
        tag = 'Offre Spéciale',
        durationWeeks = 1,
      } = req.body || {};

      if (!title || !title.trim() || !content || !content.trim()) {
        await client.end();
        return res.status(400).json({ error: 'Le titre et la description sont obligatoires.' });
      }

      // Calcul STRICT côté serveur : 1 000 FCFA par semaine de visibilité
      const weeks = Math.max(1, parseInt(durationWeeks, 10) || 1);
      const calculatedPrice = weeks * 1000;

      // Insertion dans la base de données avec statut PENDING_PAYMENT (JAMAIS ACTIVE DIRECTEMENT)
      const insertQuery = `
        INSERT INTO public.advertisements (
          id,
          title,
          content,
          "imageUrl",
          "targetUrl",
          "targetCountryCode",
          "isActive",
          "userId",
          advertiser,
          tag,
          "durationWeeks",
          "amountPaid",
          status,
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          'ALL',
          false,
          $5,
          $6,
          $7,
          $8,
          $9,
          'PENDING_PAYMENT',
          NOW(),
          NOW()
        )
        RETURNING *;
      `;

      const insertRes = await client.query(insertQuery, [
        title.trim(),
        content.trim(),
        imageUrl || '',
        targetUrl || '',
        authUser.sub,
        advertiser || authUser.email || 'Annonceur Partenaire',
        tag,
        weeks,
        calculatedPrice,
      ]);

      const createdAd = insertRes.rows[0];
      await client.end();

      return res.status(201).json({
        message: 'Publicité enregistrée en attente de paiement Mobile Money.',
        ad: createdAd,
        calculatedAmount: calculatedPrice,
        status: 'PENDING_PAYMENT',
      });
    }

    // =========================================================================
    // 3. PUT : Modification ou renouvellement avec CONTRÔLE D'ACCÈS PROPRIÉTAIRE
    // =========================================================================
    if (req.method === 'PUT') {
      const authUser = getAuthenticatedUser(req);
      if (!authUser || !authUser.sub) {
        await client.end();
        return res.status(401).json({ error: 'Authentification requise.' });
      }

      const {
        id,
        title,
        content,
        imageUrl,
        targetUrl,
        tag,
        renewWeeks,
      } = req.body || {};

      if (!id) {
        await client.end();
        return res.status(400).json({ error: "L'identifiant de la publicité est obligatoire." });
      }

      // 1. Recherche de la publicité et VÉRIFICATION STRICTE DE PROPRIÉTÉ
      const adRes = await client.query('SELECT * FROM public.advertisements WHERE id = $1 LIMIT 1;', [id]);
      if (adRes.rows.length === 0) {
        await client.end();
        return res.status(404).json({ error: 'Publicité introuvable.' });
      }

      const existingAd = adRes.rows[0];
      const isOwner = existingAd.userId === authUser.sub;
      const isAdmin = authUser.role === 'ADMIN' || authUser.role === 'DEVELOPER' || authUser.role === 'developer';

      // PROTECTION CRITIQUE : Refuser catégoriquement si ce n'est pas le propriétaire ni l'admin
      if (!isOwner && !isAdmin) {
        await client.end();
        return res.status(403).json({
          error: "Action interdite : vous n'êtes pas autorisé à modifier la publicité d'un autre utilisateur.",
        });
      }

      // Si c'est un renouvellement
      if (renewWeeks) {
        const weeks = Math.max(1, parseInt(renewWeeks, 10));
        const renewPrice = weeks * 1000;
        await client.end();
        return res.status(200).json({
          message: 'Demande de renouvellement initialisée.',
          adId: existingAd.id,
          renewWeeks: weeks,
          amountToPay: renewPrice,
          status: 'PENDING_PAYMENT',
        });
      }

      // Mise à jour normale du contenu
      const updateRes = await client.query(`
        UPDATE public.advertisements
        SET
          title = COALESCE($1, title),
          content = COALESCE($2, content),
          "imageUrl" = COALESCE($3, "imageUrl"),
          "targetUrl" = COALESCE($4, "targetUrl"),
          tag = COALESCE($5, tag),
          "updatedAt" = NOW()
        WHERE id = $6
        RETURNING *;
      `, [title, content, imageUrl, targetUrl, tag, id]);

      await client.end();
      return res.status(200).json({
        message: 'Publicité mise à jour avec succès par son propriétaire légitime.',
        ad: updateRes.rows[0],
      });
    }

    // =========================================================================
    // 4. DELETE : Suppression avec CONTRÔLE D'ACCÈS PROPRIÉTAIRE
    // =========================================================================
    if (req.method === 'DELETE') {
      const authUser = getAuthenticatedUser(req);
      if (!authUser || !authUser.sub) {
        await client.end();
        return res.status(401).json({ error: 'Authentification requise.' });
      }

      const { id } = req.query || req.body || {};
      if (!id) {
        await client.end();
        return res.status(400).json({ error: "L'identifiant de la publicité est obligatoire." });
      }

      // Vérification propriétaire
      const adRes = await client.query('SELECT "userId" FROM public.advertisements WHERE id = $1 LIMIT 1;', [id]);
      if (adRes.rows.length === 0) {
        await client.end();
        return res.status(404).json({ error: 'Publicité introuvable.' });
      }

      const isOwner = adRes.rows[0].userId === authUser.sub;
      const isAdmin = authUser.role === 'ADMIN' || authUser.role === 'DEVELOPER' || authUser.role === 'developer';

      if (!isOwner && !isAdmin) {
        await client.end();
        return res.status(403).json({
          error: "Action interdite : vous n'êtes pas autorisé à supprimer la publicité d'un autre utilisateur.",
        });
      }

      await client.query('DELETE FROM public.advertisements WHERE id = $1;', [id]);
      await client.end();

      return res.status(200).json({ success: true, message: 'Publicité supprimée avec succès.' });
    }

    await client.end();
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (err) {
    console.error('Erreur API Ads Manage:', err);
    try { await client.end(); } catch (e) {}
    return res.status(500).json({ error: 'Erreur interne du serveur lors de la gestion des publicités.' });
  }
};
