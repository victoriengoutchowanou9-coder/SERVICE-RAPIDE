const { Client } = require('pg');

async function checkSupabase() {
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
    console.log('STATUS: CONNECTED_TO_SUPABASE');

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('TABLES_FOUND:');
    tables.rows.forEach(t => console.log(' - ' + t.table_name));

    const policies = await client.query(`
      SELECT policyname, tablename, permissive, roles, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);

    console.log('\nTOTAL_RLS_POLICIES: ' + policies.rows.length);
    policies.rows.slice(0, 5).forEach(p => console.log(` - ${p.tablename}: ${p.policyname}`));

    await client.end();
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

checkSupabase();
