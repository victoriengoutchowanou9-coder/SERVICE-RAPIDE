const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // Nettoyage des espaces éventuels dans le mot de passe d'application Google (ex: "abcd efgh ijkl mnop")
  const cleanPass = pass.replace(/\s+/g, '');

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
 * Envoi de l'e-mail de confirmation d'inscription
 */
async function sendConfirmationEmail(toEmail, code, firstName = '') {
  const transporter = getTransporter();
  const senderEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'contact@servicerapide.africa';

  if (!transporter) {
    console.warn(`[MAILER] SMTP non configuré (GMAIL_USER ou GMAIL_APP_PASSWORD manquant dans les variables d'environnement).`);
    return { sent: false, reason: 'MISSING_SMTP_CREDENTIALS' };
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
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
          <h2 class="title">Bienvenue ${firstName ? firstName : ''} !</h2>
          <p class="text">Merci pour votre inscription sur <strong>SERVICE RAPIDE</strong>. Pour activer votre compte et sécuriser vos accès, voici votre code de validation :</p>
          <div class="code-box">
            <div class="code-label">Code de Confirmation à 6 chiffres</div>
            <div class="code">${code}</div>
          </div>
          <p class="text" style="font-size: 12px; color: #64748b;">Ce code est valable pendant 30 minutes. Ne le communiquez à personne.</p>
        </div>
        <div class="footer">
          SERVICE RAPIDE © 2026 • Système Sécurisé<br>
          Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SERVICE RAPIDE" <${senderEmail}>`,
      to: toEmail,
      subject: `${code} est votre code de confirmation SERVICE RAPIDE`,
      html,
      text: `Votre code de confirmation SERVICE RAPIDE est : ${code}`,
    });
    console.log(`[MAILER] E-mail de confirmation envoyé avec succès à ${toEmail} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAILER] Erreur SMTP envoi confirmation à ${toEmail}:`, err.message);
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
    console.warn(`[MAILER] SMTP non configuré pour la réinitialisation.`);
    return { sent: false, reason: 'MISSING_SMTP_CREDENTIALS' };
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
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
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Sécurité du compte</p>
        </div>
        <div class="content">
          <h2 class="title">Réinitialisation de votre mot de passe</h2>
          <p class="text">Une demande de réinitialisation de mot de passe a été initiée pour votre compte. Voici votre code sécurisé :</p>
          <div class="code-box">
            <div class="code-label">Code de Réinitialisation</div>
            <div class="code">${code}</div>
          </div>
          <p class="text" style="font-size: 12px; color: #64748b;">Ce code expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
        </div>
        <div class="footer">
          SERVICE RAPIDE © 2026 • Système Sécurisé
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SERVICE RAPIDE" <${senderEmail}>`,
      to: toEmail,
      subject: `${code} est votre code de réinitialisation SERVICE RAPIDE`,
      html,
      text: `Votre code de réinitialisation SERVICE RAPIDE est : ${code}`,
    });
    console.log(`[MAILER] E-mail de réinitialisation envoyé à ${toEmail} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAILER] Erreur SMTP réinitialisation ${toEmail}:`, err.message);
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
