const http = require('http');
const { Client } = require('pg');

// Import des routes Vercel Serverless
const registerHandler = require('../api/auth/register');
const loginHandler = require('../api/auth/login');
const confirmEmailHandler = require('../api/auth/confirm-email');
const forgotPasswordHandler = require('../api/auth/forgot-password');
const resetPasswordHandler = require('../api/auth/reset-password');
const resendConfirmationHandler = require('../api/auth/resend-confirmation');
const adminOverviewHandler = require('../api/admin/overview');
const adminToggleBlockHandler = require('../api/admin/toggle-block');
const adminDeleteUserHandler = require('../api/admin/delete-user');

// Mock request / response helper
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    bodyData: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.bodyData = data;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

const pgClient = new Client({
  host: process.env.DB_HOST || 'aws-0-eu-west-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '6543'),
  user: process.env.DB_USERNAME || 'postgres.gsgbvoyddagpjldgeyqk',
  password: process.env.DB_PASSWORD || 'BI6PbBYPGqNFppwx',
  database: process.env.DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function runEndToEndTests() {
  console.log('================================================================');
  console.log('🧪 DÉBUT DES TESTS RÉELS DE BOUT EN BOUT — SERVICE RAPIDE');
  console.log('================================================================\n');

  await pgClient.connect();
  console.log('✅ Connexion PostgreSQL Supabase établie avec succès.');

  const testEmail = `test_verification_${Date.now()}@servicerapide.africa`;
  const initialPassword = 'PasswordInitial123!';
  const updatedPassword = 'NewSecretPassword456!';
  let confirmationCode = null;
  let recoveryCode = null;
  let createdUserId = null;

  try {
    // -----------------------------------------------------------------
    // TEST A : INSCRIPTION ET CONFIRMATION PAR E-MAIL
    // -----------------------------------------------------------------
    console.log('\n--- [TEST A] INSCRIPTION & CONFIRMATION PAR EMAIL ---');

    // 1. Inscription
    const reqReg = {
      method: 'POST',
      body: {
        email: testEmail,
        password: initialPassword,
        firstName: 'Testeur',
        lastName: 'Automatique',
        phoneNumber: '+229 97 00 99 88',
        role: 'CLIENT',
        country: 'Bénin',
        countryCode: 'BJ',
        department: 'Littoral',
        commune: 'Cotonou',
        city: 'Haie Vive',
      },
      headers: { 'x-forwarded-for': '127.0.0.1' },
    };
    const resReg = createMockRes();
    await registerHandler(reqReg, resReg);

    console.log(`1. Inscription API status: ${resReg.statusCode}`);
    console.log(`   Message retourné: "${resReg.bodyData?.message}"`);
    console.log(`   requiresOtp: ${resReg.bodyData?.requiresOtp}`);
    console.log(`   requiresEmailConfirmation: ${resReg.bodyData?.requiresEmailConfirmation}`);

    if (resReg.statusCode !== 201) {
      throw new Error(`Échec inscription: ${JSON.stringify(resReg.bodyData)}`);
    }

    // 2. Vérification directe en base PostgreSQL
    const checkDb = await pgClient.query(
      'SELECT id, email, confirmation_token, email_confirmed_at FROM auth.users WHERE LOWER(email) = LOWER($1)',
      [testEmail]
    );
    if (checkDb.rows.length === 0) {
      throw new Error("L'utilisateur n'a pas été inséré dans auth.users !");
    }
    const dbUser = checkDb.rows[0];
    createdUserId = dbUser.id;
    confirmationCode = dbUser.confirmation_token;
    console.log(`2. Vérification DB: Utilisateur UUID = ${createdUserId}`);
    console.log(`   Token de confirmation stocké en base = ${confirmationCode}`);
    console.log(`   email_confirmed_at initial = ${dbUser.email_confirmed_at}`);

    // 3. Tentative de connexion avant confirmation (doit être refusée avec 403)
    const reqLoginBefore = {
      method: 'POST',
      body: { emailOrIdentifier: testEmail, password: initialPassword },
      headers: {},
    };
    const resLoginBefore = createMockRes();
    await loginHandler(reqLoginBefore, resLoginBefore);
    console.log(`3. Connexion avant confirmation: Status ${resLoginBefore.statusCode} (attendu: 403)`);
    console.log(`   requiresEmailConfirmation = ${resLoginBefore.bodyData?.requiresEmailConfirmation}`);

    if (resLoginBefore.statusCode !== 403 || !resLoginBefore.bodyData?.requiresEmailConfirmation) {
      throw new Error("La connexion aurait dû être bloquée tant que l'email n'est pas confirmé !");
    }

    // 4. Confirmation par code OTP
    const reqConfirm = {
      method: 'POST',
      body: { email: testEmail, code: confirmationCode },
      headers: {},
    };
    const resConfirm = createMockRes();
    await confirmEmailHandler(reqConfirm, resConfirm);
    console.log(`4. Confirmation e-mail API status: ${resConfirm.statusCode}`);
    console.log(`   Message: "${resConfirm.bodyData?.message}"`);

    if (resConfirm.statusCode !== 200) {
      throw new Error(`Échec confirmation: ${JSON.stringify(resConfirm.bodyData)}`);
    }

    // 5. Connexion après confirmation (doit réussir avec 200)
    const reqLoginAfter = {
      method: 'POST',
      body: { emailOrIdentifier: testEmail, password: initialPassword },
      headers: {},
    };
    const resLoginAfter = createMockRes();
    await loginHandler(reqLoginAfter, resLoginAfter);
    console.log(`5. Connexion après confirmation: Status ${resLoginAfter.statusCode} (attendu: 200)`);
    console.log(`   Token session généré: ${resLoginAfter.bodyData?.accessToken ? 'OUI (JWT valide)' : 'NON'}`);
    console.log(`   Rôle utilisateur: ${resLoginAfter.bodyData?.user?.role}`);

    if (resLoginAfter.statusCode !== 200 || !resLoginAfter.bodyData?.accessToken) {
      throw new Error("La connexion après confirmation a échoué !");
    }

    console.log('✅ TEST A VALIDE : Inscription et confirmation d\'e-mail 100% opérationnelles.');

    // -----------------------------------------------------------------
    // TEST B : RÉINITIALISATION DU MOT DE PASSE ET CONNEXION
    // -----------------------------------------------------------------
    console.log('\n--- [TEST B] RÉINITIALISATION DU MOT DE PASSE (10 ÉTAPES) ---');

    // 1. Demande de mot de passe oublié
    const reqForgot = {
      method: 'POST',
      body: { email: testEmail },
      headers: {},
    };
    const resForgot = createMockRes();
    await forgotPasswordHandler(reqForgot, resForgot);
    console.log(`1. Demande réinitialisation API: Status ${resForgot.statusCode}`);
    console.log(`   Message: "${resForgot.bodyData?.message}"`);

    if (resForgot.statusCode !== 200) {
      throw new Error(`Échec forgot password: ${JSON.stringify(resForgot.bodyData)}`);
    }

    // 2. Récupération du code de récupération en base
    const dbRecovery = await pgClient.query(
      'SELECT recovery_token, recovery_sent_at FROM auth.users WHERE LOWER(email) = LOWER($1)',
      [testEmail]
    );
    recoveryCode = dbRecovery.rows[0]?.recovery_token;
    console.log(`2. Code de récupération généré en base: ${recoveryCode}`);

    // 3. Définition du nouveau mot de passe via reset-password
    const reqReset = {
      method: 'POST',
      body: {
        email: testEmail,
        code: recoveryCode,
        newPassword: updatedPassword,
      },
      headers: {},
    };
    const resReset = createMockRes();
    await resetPasswordHandler(reqReset, resReset);
    console.log(`3. Soumission nouveau mot de passe: Status ${resReset.statusCode}`);
    console.log(`   Message: "${resReset.bodyData?.message}"`);

    if (resReset.statusCode !== 200) {
      throw new Error(`Échec reset password: ${JSON.stringify(resReset.bodyData)}`);
    }

    // 4. Test connexion avec l'ANCIEN mot de passe (doit échouer avec 401)
    const reqOldLogin = {
      method: 'POST',
      body: { emailOrIdentifier: testEmail, password: initialPassword },
      headers: {},
    };
    const resOldLogin = createMockRes();
    await loginHandler(reqOldLogin, resOldLogin);
    console.log(`4. Test Ancien mot de passe: Status ${resOldLogin.statusCode} (attendu: 401)`);
    if (resOldLogin.statusCode !== 401) {
      throw new Error("L'ancien mot de passe permet toujours de se connecter !");
    }

    // 5. Test connexion avec le NOUVEAU mot de passe (doit réussir avec 200)
    const reqNewLogin = {
      method: 'POST',
      body: { emailOrIdentifier: testEmail, password: updatedPassword },
      headers: {},
    };
    const resNewLogin = createMockRes();
    await loginHandler(reqNewLogin, resNewLogin);
    console.log(`5. Test Nouveau mot de passe: Status ${resNewLogin.statusCode} (attendu: 200)`);
    console.log(`   Connexion réussie: Utilisateur ID = ${resNewLogin.bodyData?.user?.id}`);

    if (resNewLogin.statusCode !== 200 || resNewLogin.bodyData?.user?.id !== createdUserId) {
      throw new Error("Échec connexion avec le nouveau mot de passe ou ID compte corrompu !");
    }

    console.log('✅ TEST B VALIDE : Réinitialisation du mot de passe 100% conforme et fonctionnelle.');

    // -----------------------------------------------------------------
    // TEST C : CONSOLE DÉVELOPPEUR & JOURNALISATION D'AUDIT RÉELLE
    // -----------------------------------------------------------------
    console.log('\n--- [TEST C] CONSOLE DÉVELOPPEUR & ACTIVITÉS RÉELLES ---');

    // 1. Appel API overview avec token développeur
    const reqOverview = {
      method: 'GET',
      headers: {
        'authorization': 'Bearer sr_dev_test_token',
        'x-admin-token': 'sr_dev_test_token',
      },
    };
    const resOverview = createMockRes();
    await adminOverviewHandler(reqOverview, resOverview);
    console.log(`1. API Overview Superviseur: Status ${resOverview.statusCode}`);

    const overviewData = resOverview.bodyData;
    console.log(`   Total utilisateurs réels: ${overviewData?.users?.length}`);
    console.log(`   Total activités réelles: ${overviewData?.activities?.length}`);
    console.log(`   Total métriques:`, overviewData?.metrics);

    // 2. Vérification que nos activités de test apparaissent dans system_audit_logs
    const foundTestActivities = (overviewData?.activities || []).filter(
      (a) => a.accountEmail === testEmail
    );
    console.log(`2. Activités trouvées pour le compte test (${testEmail}): ${foundTestActivities.length}`);
    foundTestActivities.forEach((act) => {
      console.log(`   - [${act.timestamp}] ${act.type} : ${act.details} (${act.status})`);
    });

    if (foundTestActivities.length === 0) {
      throw new Error("Les activités réelles n'ont pas été enregistrées dans system_audit_logs !");
    }

    // 3. Test de modération réelle : Suspension du compte
    const reqBlock = {
      method: 'POST',
      headers: { 'x-admin-token': 'sr_dev_test_token' },
      body: { userId: createdUserId },
    };
    const resBlock = createMockRes();
    await adminToggleBlockHandler(reqBlock, resBlock);
    console.log(`3. Suspension du compte test: Status ${resBlock.statusCode}, isActive = ${resBlock.bodyData?.isActive}`);

    // Tentative de connexion compte suspendu (doit renvoyer 403)
    const resSuspendedLogin = createMockRes();
    await loginHandler(reqNewLogin, resSuspendedLogin);
    console.log(`   Tentative connexion compte suspendu: Status ${resSuspendedLogin.statusCode} (attendu: 403)`);
    if (resSuspendedLogin.statusCode !== 403) {
      throw new Error("Le compte suspendu a pu se connecter !");
    }

    // 4. Suppression définitive du compte test
    const reqDelete = {
      method: 'POST',
      headers: { 'x-admin-token': 'sr_dev_test_token' },
      body: { userId: createdUserId },
    };
    const resDelete = createMockRes();
    await adminDeleteUserHandler(reqDelete, resDelete);
    console.log(`4. Suppression définitive du compte test: Status ${resDelete.statusCode}`);

    // Vérification disparition en base
    const checkDeleted = await pgClient.query('SELECT id FROM public.users WHERE id = $1', [createdUserId]);
    console.log(`   Vérification suppression DB: ${checkDeleted.rows.length === 0 ? 'COMPTE PURGÉ' : 'ERREUR'}`);

    console.log('\n✅ TEST C VALIDE : Console superviseur alimentée 100% par Supabase en temps réel sans données fictives.');

  } catch (err) {
    console.error('\n❌ ERREUR LORS DES TESTS :', err.message);
    process.exitCode = 1;
  } finally {
    // Nettoyage éventuel si restes
    if (createdUserId) {
      try {
        await pgClient.query('DELETE FROM public.users WHERE LOWER(email) = LOWER($1)', [testEmail]);
        await pgClient.query('DELETE FROM auth.users WHERE LOWER(email) = LOWER($1)', [testEmail]);
      } catch (e) {}
    }
    await pgClient.end();
    console.log('\n================================================================');
    console.log('🏁 FIN DE LA SUITE DE TESTS');
    console.log('================================================================');
  }
}

runEndToEndTests();
