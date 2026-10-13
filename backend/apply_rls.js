const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyRLS() {
  console.log('Application du RLS et des policies sur Supabase...');

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
    const sql = fs.readFileSync(path.resolve(__dirname, 'activate_rls.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ RLS activé sur toutes les tables avec succès !');
    
    // Vérifier les tables avec RLS activé
    const res = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log('Statut RLS des tables :');
    res.rows.forEach(r => console.log(` - ${r.tablename}: RLS = ${r.rowsecurity}`));

    await client.end();
  } catch (err) {
    console.error('Erreur RLS :', err.message);
    process.exit(1);
  }
}

applyRLS();
