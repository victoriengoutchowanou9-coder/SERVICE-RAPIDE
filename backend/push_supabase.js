const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function pushToSupabase() {
  console.log('Connexion à Supabase PostgreSQL (eu-west-1)...');

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
    console.log('✅ Connecté avec succès à Supabase !');

    const schemaPath = path.resolve(__dirname, '..', 'supabase_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Création et synchronisation des tables...');
    await client.query(sql);
    console.log('✅ Toutes les tables et enums ont été poussés sur Supabase !');

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Tables présentes dans votre base Supabase :');
    tablesRes.rows.forEach(r => console.log(`   - ${r.table_name}`));

    await client.end();
    console.log('🚀 Opération terminée avec succès.');
  } catch (error) {
    console.error('❌ Erreur lors du push Supabase :', error.message);
    process.exit(1);
  }
}

pushToSupabase();
