const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Génère un mot de passe fort et unique
function generateStrongPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+';
  const bytes = crypto.randomBytes(20);
  let password = '';
  for (let i = 0; i < 18; i++) {
    password += chars[bytes[i] % chars.length];
  }
  // S'assurer de la présence de majuscule, minuscule, chiffre et symbole
  return password + 'A1!';
}

async function setupDeveloperAccount() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.gsgbvoyddagpjldgeyqk',
    password: 'BI6PbBYPGqNFppwx',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('1. Connecté à PostgreSQL Supabase avec privilèges administrateur...');

    // 1. Ajouter 'DEVELOPER' à l'enum user_role_enum si absent
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'DEVELOPER';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ 2. Valeur DEVELOPER ajoutée à user_role_enum.');

    // 2. Ajouter colonne identifier à public.users
    await client.query(`
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS identifier VARCHAR(100) UNIQUE;
    `);
    console.log('✅ 3. Colonne identifier vérifiée sur public.users.');

    // 3. Trigger serveur de protection contre l'auto-attribution des rôles développeur / admin
    await client.query(`
      CREATE OR REPLACE FUNCTION public.protect_user_role()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
          IF current_user NOT IN ('postgres', 'service_role') AND 
             COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN
            IF NEW.role IN ('DEVELOPER', 'ADMIN') THEN
              RAISE EXCEPTION 'Attribution du rôle réservé DEVELOPER/ADMIN interdite côté client.';
            END IF;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_protect_user_role ON public.users;
      CREATE TRIGGER trg_protect_user_role
        BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE PROCEDURE public.protect_user_role();
    `);
    console.log('✅ 4. Trigger serveur de protection des rôles déployé.');

    // 4. Définir le compte développeur
    const devEmail = 'developer_admin@servicerapide.africa';
    const devIdentifier = 'developer_admin';
    const initialPassword = generateStrongPassword();

    // Vérifier si auth.users contient déjà ce développeur
    const existing = await client.query('SELECT id FROM auth.users WHERE email = $1', [devEmail]);

    let devUserId;
    if (existing.rows.length === 0) {
      // Création du compte dans auth.users avec hachage bcrypt
      const insertAuth = await client.query(`
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at
        )
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          $1,
          crypt($2, gen_salt('bf', 10)),
          NOW(),
          '{"provider":"email","providers":["email"]}',
          '{"firstName":"Superviseur","lastName":"Développeur","identifier":"developer_admin"}',
          NOW(),
          NOW()
        )
        RETURNING id;
      `, [devEmail, initialPassword]);

      devUserId = insertAuth.rows[0].id;
      console.log('✅ 5. Compte créé dans auth.users avec id :', devUserId);
    } else {
      devUserId = existing.rows[0].id;
      // Mise à jour du mot de passe avec le nouveau mot de passe fort
      await client.query(`
        UPDATE auth.users
        SET 
          encrypted_password = crypt($2, gen_salt('bf', 10)),
          email_confirmed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1;
      `, [devUserId, initialPassword]);
      console.log('✅ 5. Compte existant dans auth.users mis à jour avec le mot de passe généré.');
    }

    // 5. Mettre à jour public.users avec le rôle DEVELOPER
    await client.query(`
      INSERT INTO public.users (
        id,
        email,
        identifier,
        "firstName",
        "lastName",
        role,
        "isActive",
        "countryCode",
        "preferredLanguage"
      )
      VALUES ($1, $2, $3, 'Superviseur', 'Développeur', 'DEVELOPER', true, 'CI', 'fr')
      ON CONFLICT (id) DO UPDATE
      SET 
        role = 'DEVELOPER',
        identifier = EXCLUDED.identifier,
        "isActive" = true,
        "updatedAt" = NOW();
    `, [devUserId, devEmail, devIdentifier]);
    console.log('✅ 6. Entrée public.users configurée avec le rôle DEVELOPER.');

    // 6. Vérification cryptographique immédiate du mot de passe
    const verifyQuery = await client.query(`
      SELECT (encrypted_password = crypt($2, encrypted_password)) AS is_valid
      FROM auth.users
      WHERE email = $1;
    `, [devEmail, initialPassword]);

    const isValid = verifyQuery.rows[0]?.is_valid;
    if (!isValid) {
      throw new Error("Échec de vérification du hachage de mot de passe.");
    }
    console.log('✅ 7. Test de validation cryptographique du mot de passe : SUCCÈS.');

    // 7. Enregistrer les informations dans un fichier local sécurisé temporaire
    const credentials = {
      role: 'DEVELOPER',
      identifier: devIdentifier,
      email: devEmail,
      password: initialPassword,
      userId: devUserId,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(__dirname, 'developer_credentials.secret.json'), JSON.stringify(credentials, null, 2));
    console.log('🎉 8. Compte développeur prêt et vérifié avec succès !');

    await client.end();
  } catch (err) {
    console.error('❌ Erreur lors de la configuration du compte développeur :', err.message);
    process.exit(1);
  }
}

setupDeveloperAccount();
