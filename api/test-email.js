// Endpoint de diagnostic SMTP — accessible via GET /api/test-email
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const diag = {
    GMAIL_USER: process.env.GMAIL_USER || null,
    SMTP_USER: process.env.SMTP_USER || null,
    MAIL_USER: process.env.MAIL_USER || null,
    EMAIL_USER: process.env.EMAIL_USER || null,
    GMAIL_EMAIL: process.env.GMAIL_EMAIL || null,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '***SET***' : null,
    SMTP_PASS: process.env.SMTP_PASS ? '***SET***' : null,
    MAIL_PASS: process.env.MAIL_PASS ? '***SET***' : null,
    EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : null,
    GMAIL_PASSWORD: process.env.GMAIL_PASSWORD ? '***SET***' : null,
    GMAIL_PASS: process.env.GMAIL_PASS ? '***SET***' : null,
    APP_PASSWORD: process.env.APP_PASSWORD ? '***SET***' : null,
  };

  // Essai d'envoi
  try {
    const { sendConfirmationEmail } = require('../lib/mailer');
    const to = req.query.to || 'goutchowanoubienvenu@gmail.com';
    const result = await sendConfirmationEmail(to, '123456', 'Test');
    return res.status(200).json({ status: 'OK', envVars: diag, emailResult: result, sentTo: to });
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', envVars: diag, error: err.message });
  }
};
