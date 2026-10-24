const { Client } = require('pg');

async function fix() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.gsgbvoyddagpjldgeyqk',
    password: 'BI6PbBYPGqNFppwx',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connecté à PostgreSQL Supabase...');

    // 1. Ajouter la colonne "isActive" si elle n'existe pas
    await client.query(`
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
    `);
    console.log('✅ Colonne "isActive" ajoutée avec succès à public.users');

    // 2. Mettre à jour la fonction handle_new_user
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.users (
          id,
          email,
          "firstName",
          "lastName",
          "phoneNumber",
          "countryCode",
          "preferredLanguage",
          role,
          "isActive",
          "updatedAt"
        )
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'firstName', ''),
          COALESCE(new.raw_user_meta_data->>'lastName', ''),
          COALESCE(new.raw_user_meta_data->>'phoneNumber', ''),
          COALESCE(new.raw_user_meta_data->>'countryCode', 'CI'),
          COALESCE(new.raw_user_meta_data->>'preferredLanguage', 'fr'),
          'PENDING',
          true,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
          email = EXCLUDED.email,
          "firstName" = COALESCE(NULLIF(EXCLUDED."firstName", ''), public.users."firstName"),
          "lastName" = COALESCE(NULLIF(EXCLUDED."lastName", ''), public.users."lastName"),
          "updatedAt" = NOW();
        RETURN new;
      EXCEPTION
        WHEN OTHERS THEN
          -- Logger l'erreur sans bloquer la création auth si besoin
          RAISE WARNING 'handle_new_user error: %', SQLERRM;
          RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ Fonction public.handle_new_user sécurisée avec gestion des exceptions');

    // 3. Recréer le trigger proprement sur auth.users (INSERT uniquement)
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log('✅ Trigger on_auth_user_created recréé sur auth.users');

    // 4. Donner les droits nécessaires
    await client.query(`
      GRANT ALL ON TABLE public.users TO postgres, service_role;
      GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO anon, authenticated;
    `);
    console.log('✅ Permissions accordées sur public.users');

    await client.end();
    console.log('🎉 Réparation terminée avec succès !');
  } catch (err) {
    console.error('❌ Erreur :', err);
    process.exit(1);
  }
}

fix();
