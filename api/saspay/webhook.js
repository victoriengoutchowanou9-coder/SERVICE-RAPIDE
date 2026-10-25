const crypto = require('crypto');
const { Client } = require('pg');

module.exports = async (req, res) => {
  // Seul le POST est accepté par les webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const eventType = req.headers['x-webhook-event'];

  const webhookSecret = process.env.SASPAY_WEBHOOK_SECRET || process.env.SASPAY_SECRET_KEY || '';

  // Vérification de la signature si le secret est configuré
  if (webhookSecret && signature && timestamp) {
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const signedPayload = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

      // Comparaison constante pour éviter les attaques temporelles
      if (
        signature.length === expectedSignature.length &&
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
      ) {
        console.warn('⚠️ Signature de webhook SasPay invalide.');
        return res.status(401).json({ error: 'Signature de webhook invalide.' });
      }
    } catch (e) {
      console.warn('Erreur vérification signature webhook :', e.message);
    }
  }

  const payload = req.body || {};
  const event = eventType || payload.event || '';
  const data = payload.data || payload;

  console.log(`🔔 Webhook SasPay reçu [${event}] :`, JSON.stringify(data));

  // Traitement si le paiement a réussi
  const isSuccess =
    event === 'transaction.success' ||
    event === 'checkout_session.paid' ||
    data.status === 'SUCCESS' ||
    data.status === 'PAID';

  if (!isSuccess) {
    // Si ce n'est pas un événement de succès (ex: en attente ou échec), acquitter simplement
    return res.status(200).json({ received: true, status: 'acknowledged' });
  }

  const metadata = data.metadata || {};
  const amount = parseFloat(data.amount || '0');
  const action = metadata.action || (amount >= 5000 ? 'PROVIDER_SUBSCRIPTION' : 'CONTACT_UNLOCK');
  const userId = metadata.userId;
  const providerId = metadata.providerId || metadata.providerProfileId;

  // Connexion sécurisée à Supabase PostgreSQL pour appliquer les droits
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

    // 1. Enregistrer le paiement dans la table payments
    let paymentId = null;
    try {
      const paymentRes = await pgClient.query(`
        INSERT INTO public.payments (
          id,
          "userId",
          type,
          amount,
          currency,
          method,
          status,
          "transactionReference",
          "phoneNumberUsed",
          "createdAt"
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'XOF',
          'MTN_MOMO',
          'COMPLETED',
          $4,
          $5,
          NOW()
        )
        RETURNING id;
      `, [
        userId || '00000000-0000-0000-0000-000000000000',
        action === 'PROVIDER_SUBSCRIPTION' ? 'PROVIDER_SUBSCRIPTION' : 'CLIENT_CONTACT_UNLOCK',
        amount || (action === 'PROVIDER_SUBSCRIPTION' ? 5000 : 1000),
        data.reference || data.id || `SASPAY-${Date.now()}`,
        data.phone || data.customer_phone || '',
      ]);

      paymentId = paymentRes.rows[0]?.id;
    } catch (paymentErr) {
      console.warn('Paiement log warning :', paymentErr.message);
    }

    // 2. Si c'est un abonnement prestataire : prolonger de 30 jours
    if (action === 'PROVIDER_SUBSCRIPTION' && (providerId || userId)) {
      await pgClient.query(`
        UPDATE public.provider_profiles
        SET 
          "subscriptionExpiresAt" = GREATEST(COALESCE("subscriptionExpiresAt", NOW()), NOW()) + INTERVAL '30 days',
          "updatedAt" = NOW()
        WHERE "userId" = $1 OR id::text = $2;
      `, [userId, providerId]);

      console.log('✅ Abonnement prestataire prolongé de 30 jours avec succès !');
    }

    // 2b. Si c'est un abonnement client (pass mensuel de contact)
    if (action === 'CLIENT_SUBSCRIPTION' && userId) {
      await pgClient.query(`
        UPDATE public.users
        SET 
          "clientSubscriptionExpiresAt" = GREATEST(COALESCE("clientSubscriptionExpiresAt", NOW()), NOW()) + INTERVAL '30 days',
          "updatedAt" = NOW()
        WHERE id = $1;
      `, [userId]);

      console.log('✅ Abonnement client mensuel activé pour 30 jours !');
    }

    // 3. Si c'est un déblocage de contact : créer l'entrée contact_unlocks
    if (action === 'CONTACT_UNLOCK' && userId && providerId) {
      await pgClient.query(`
        INSERT INTO public.contact_unlocks (
          id,
          "clientId",
          "providerId",
          "paymentId",
          "isUnlockedViaTrial",
          "createdAt"
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          false,
          NOW()
        )
        ON CONFLICT DO NOTHING;
      `, [userId, providerId, paymentId]);

      console.log('✅ Contact prestataire débloqué avec succès pour le client !');
    }

    // 4. Si c'est une publication de publicité payante (1 000 FCFA / semaine)
    if (action === 'AD_PUBLICATION') {
      const durationWeeks = Math.max(1, parseInt(metadata.durationWeeks || 1, 10));
      const adTitle = metadata.title || 'Annonce sponsorisée';
      const adContent = metadata.content || '';
      const adUrl = metadata.targetUrl || '';
      const adImage = metadata.imageUrl || '';
      try {
        await pgClient.query(`
          INSERT INTO public.advertisements (
            id,
            title,
            content,
            "imageUrl",
            "targetUrl",
            "isActive",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            true,
            NOW(),
            NOW() + ($5 || ' days')::interval
          );
        `, [adTitle, adContent, adImage, adUrl, durationWeeks * 7]);
        console.log(`✅ Publicité activée pour ${durationWeeks} semaines (${durationWeeks * 1000} FCFA)`);
      } catch (adErr) {
        console.warn('Ad insertion warning :', adErr.message);
      }
    }

    await pgClient.end();
    return res.status(200).json({
      success: true,
      message: 'Paiement SasPay traité et activé avec succès en base de données.',
    });
  } catch (dbErr) {
    console.error('❌ Erreur traitement webhook base de données :', dbErr.message);
    try { await pgClient.end(); } catch (e) {}
    // Acquitter 200 à SasPay pour éviter des renvois infinis si erreur locale
    return res.status(200).json({ error: 'DB processing error', details: dbErr.message });
  }
};
