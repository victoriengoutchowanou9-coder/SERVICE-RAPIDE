const nodemailer = require('nodemailer');

function getTransporter() {
  // Chercher les credentials SMTP dans toutes les variantes possibles de noms de variables
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.MAIL_USER
    || process.env.EMAIL_USER || process.env.NODEMAILER_USER || process.env.GMAIL_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.MAIL_PASS
    || process.env.EMAIL_PASS || process.env.GMAIL_PASSWORD || process.env.GMAIL_PASS
    || process.env.NODEMAILER_PASS || process.env.APP_PASSWORD;

  // Log de diagnostic (visible dans Vercel Function Logs)
  console.log('[MAILER-DIAG] Variables SMTP détectées:', {
    GMAIL_USER: process.env.GMAIL_USER ? '✅ défini' : '❌ absent',
    SMTP_USER: process.env.SMTP_USER ? '✅ défini' : '❌ absent',
    MAIL_USER: process.env.MAIL_USER ? '✅ défini' : '❌ absent',
    EMAIL_USER: process.env.EMAIL_USER ? '✅ défini' : '❌ absent',
    GMAIL_EMAIL: process.env.GMAIL_EMAIL ? '✅ défini' : '❌ absent',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '✅ défini' : '❌ absent',
    SMTP_PASS: process.env.SMTP_PASS ? '✅ défini' : '❌ absent',
    MAIL_PASS: process.env.MAIL_PASS ? '✅ défini' : '❌ absent',
    EMAIL_PASS: process.env.EMAIL_PASS ? '✅ défini' : '❌ absent',
    GMAIL_PASSWORD: process.env.GMAIL_PASSWORD ? '✅ défini' : '❌ absent',
    GMAIL_PASS: process.env.GMAIL_PASS ? '✅ défini' : '❌ absent',
    APP_PASSWORD: process.env.APP_PASSWORD ? '✅ défini' : '❌ absent',
    userFound: user ? `✅ ${user}` : '❌ AUCUN',
    passFound: pass ? '✅ (masqué)' : '❌ AUCUN',
  });

  if (!user || !pass) {
    console.error('[MAILER] ❌ SMTP NON CONFIGURÉ — aucun email ne sera envoyé. Ajoutez GMAIL_USER et GMAIL_APP_PASSWORD dans les variables d\'environnement Vercel.');
    return null;
  }

  // Nettoyage des espaces éventuels dans le mot de passe d'application Google (ex: "abcd efgh ijkl mnop")
  const cleanPass = pass.replace(/\s+/g, '');

  console.log(`[MAILER] ✅ Transporter SMTP configuré avec ${user}`);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: (process.env.SMTP_SECURE !== 'false'),
    auth: {
      user: user.trim(),
      pass: cleanPass,
    },
  });
}

/**
 * Headers anti-spam communs pour améliorer la délivrabilité.
 * Ces headers indiquent aux filtres que le mail est transactionnel et légitime.
 */
function getAntiSpamHeaders(senderEmail) {
  return {
    'X-Priority': '1',
    'X-Mailer': 'SERVICE RAPIDE Transactional Mailer',
    'Precedence': 'bulk',
    'X-Auto-Response-Suppress': 'OOF, AutoReply',
    'Reply-To': senderEmail,
    'List-Unsubscribe': `<mailto:${senderEmail}?subject=unsubscribe>`,
  };
}

/**
 * Envoi de l'e-mail de confirmation d'inscription
 */
async function sendConfirmationEmail(toEmail, code, firstName = '') {
  const transporter = getTransporter();
  const senderEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'contact@servicerapide.africa';

  if (!transporter) {
    console.warn(`[MAILER] SMTP non configuré (GMAIL_USER ou GMAIL_APP_PASSWORD manquant dans les variables d'environnement).`);
    return { sent: false, reason: 'MISSING_SMTP_CREDENTIALS' };
  }

  const greeting = firstName ? `Bonjour ${firstName}` : 'Bonjour';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #16a34a, #059669); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
        .logo span { color: #facc15; }
        .content { padding: 32px 28px; }
        .title { font-size: 18px; font-weight: 800; margin-top: 0; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .code-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0; }
        .code-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #15803d; letter-spacing: 1px; margin-bottom: 6px; }
        .code { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #166534; font-family: monospace; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">SERVICE <span>RAPIDE</span></h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Plateforme panafricaine de mise en relation directe</p>
        </div>
        <div class="content">
          <h2 class="title">${greeting}, bienvenue !</h2>
          <p class="text">Merci pour votre inscription sur <strong>SERVICE RAPIDE</strong>. Pour activer votre compte et s\u00e9curiser vos acc\u00e8s, veuillez saisir le code ci-dessous dans l'application :</p>
          <div class="code-box">
            <div class="code-label">Code de Confirmation</div>
            <div class="code">${code}</div>
          </div>
          <p class="text" style="font-size: 12px; color: #64748b;">Ce code est valable pendant 30 minutes. Ne le communiquez \u00e0 personne.</p>
        </div>
        <div class="footer">
          SERVICE RAPIDE &copy; 2026 &bull; Syst\u00e8me S\u00e9curis\u00e9<br>
          Si vous n'\u00eates pas \u00e0 l'origine de cette demande, vous pouvez ignorer cet e-mail.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`[MAILER] Tentative d'envoi à ${toEmail} depuis ${senderEmail}...`);
    const info = await transporter.sendMail({
      from: {
        name: 'SERVICE RAPIDE',
        address: senderEmail,
      },
      replyTo: senderEmail,
      to: toEmail,
      subject: `Votre code de confirmation SERVICE RAPIDE`,
      html,
      text: `${greeting},\n\nVotre code de confirmation SERVICE RAPIDE est : ${code}\n\nCe code est valable 30 minutes.\n\nCordialement,\nL'equipe SERVICE RAPIDE`,
      headers: getAntiSpamHeaders(senderEmail),
    });
    console.log(`[MAILER] ✅ E-mail de confirmation envoyé avec succès à ${toEmail} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAILER] ❌ Erreur SMTP envoi confirmation à ${toEmail}:`, err.message, err.code, err.responseCode);
    return { sent: false, error: err.message };
  }
}

/**
 * Envoi de l'e-mail de réinitialisation de mot de passe
 */
async function sendPasswordResetEmail(toEmail, code) {
  const transporter = getTransporter();
  const senderEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'contact@servicerapide.africa';

  if (!transporter) {
    console.warn(`[MAILER] SMTP non configure pour la reinitialisation.`);
    return { sent: false, reason: 'MISSING_SMTP_CREDENTIALS' };
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #16a34a, #059669); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
        .logo span { color: #facc15; }
        .content { padding: 32px 28px; }
        .title { font-size: 18px; font-weight: 800; margin-top: 0; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .code-box { background: #fefce8; border: 2px dashed #ca8a04; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0; }
        .code-label { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #854d0e; letter-spacing: 1px; margin-bottom: 6px; }
        .code { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #a16207; font-family: monospace; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">SERVICE <span>RAPIDE</span></h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">S\u00e9curit\u00e9 du compte</p>
        </div>
        <div class="content">
          <h2 class="title">R\u00e9initialisation de votre mot de passe</h2>
          <p class="text">Une demande de r\u00e9initialisation de mot de passe a \u00e9t\u00e9 initi\u00e9e pour votre compte. Voici votre code s\u00e9curis\u00e9 :</p>
          <div class="code-box">
            <div class="code-label">Code de R\u00e9initialisation</div>
            <div class="code">${code}</div>
          </div>
          <p class="text" style="font-size: 12px; color: #64748b;">Ce code expire dans 30 minutes. Si vous n'\u00eates pas \u00e0 l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
        </div>
        <div class="footer">
          SERVICE RAPIDE &copy; 2026 &bull; Syst\u00e8me S\u00e9curis\u00e9
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: {
        name: 'SERVICE RAPIDE',
        address: senderEmail,
      },
      replyTo: senderEmail,
      to: toEmail,
      subject: `Reinitialisation de votre mot de passe - SERVICE RAPIDE`,
      html,
      text: `Bonjour,\n\nVotre code de reinitialisation SERVICE RAPIDE est : ${code}\n\nCe code expire dans 30 minutes.\n\nCordialement,\nL'equipe SERVICE RAPIDE`,
      headers: getAntiSpamHeaders(senderEmail),
    });
    console.log(`[MAILER] E-mail de reinitialisation envoye a ${toEmail} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAILER] Erreur SMTP reinitialisation ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
}

function defaultHandler(req, res) {
  res.status(404).json({ error: 'Fichier utilitaire interne.' });
}
defaultHandler.sendConfirmationEmail = sendConfirmationEmail;
defaultHandler.sendPasswordResetEmail = sendPasswordResetEmail;

module.exports = defaultHandler;
module.exports.sendConfirmationEmail = sendConfirmationEmail;
module.exports.sendPasswordResetEmail = sendPasswordResetEmail;
