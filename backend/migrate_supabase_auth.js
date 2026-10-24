const { Client } = require('pg');

async function migrate() {
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
    console.log('Connecté à Supabase...');

    await client.query(`
      ALTER TABLE public.users ALTER COLUMN "passwordHash" DROP NOT NULL;
      ALTER TABLE public.users ALTER COLUMN "passwordHash" SET DEFAULT '';
    `);
    console.log('✅ public.users: passwordHash rendu optionnel pour Supabase Auth.');

    // Ajouter un trigger pour créer automatiquement l'entrée public.users quand un utilisateur s'inscrit via Supabase Auth
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.users (id, email, "firstName", "lastName", "phoneNumber", "countryCode", "preferredLanguage", role, "isActive")
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'firstName', ''),
          COALESCE(new.raw_user_meta_data->>'lastName', ''),
          COALESCE(new.raw_user_meta_data->>'phoneNumber', ''),
          COALESCE(new.raw_user_meta_data->>'countryCode', 'CI'),
          COALESCE(new.raw_user_meta_data->>'preferredLanguage', 'fr'),
          'PENDING',
          true
        )
        ON CONFLICT (id) DO UPDATE
        SET 
          email = EXCLUDED.email,
          "firstName" = COALESCE(NULLIF(EXCLUDED."firstName", ''), public.users."firstName"),
          "lastName" = COALESCE(NULLIF(EXCLUDED."lastName", ''), public.users."lastName"),
          "updatedAt" = NOW();
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log('✅ Trigger on_auth_user_created configuré avec succès !');

    await client.end();
  } catch (err) {
    console.error('Erreur migration :', err.message);
    process.exit(1);
  }
}

migrate();
