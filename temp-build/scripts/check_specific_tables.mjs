import { Client } from 'pg';

const DB_HOST = process.env.PGHOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.PGPORT || '54322', 10);
const DB_USER = process.env.PGUSER || 'postgres';
const DB_PASSWORD = process.env.PGPASSWORD || 'postgres';
const DB_DATABASE = process.env.PGDATABASE || 'postgres';

const targets = ['news', 'tickets'];

async function run() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });

  try {
    await client.connect();
    console.log('Connected. Checking specific relations in public schema...');

    const sql = `
      SELECT c.relname,
             CASE c.relkind
               WHEN 'r' THEN 'table'
               WHEN 'v' THEN 'view'
               WHEN 'm' THEN 'materialized view'
               WHEN 'i' THEN 'index'
               WHEN 'S' THEN 'sequence'
               WHEN 't' THEN 'TOAST table'
               WHEN 'p' THEN 'partitioned table'
               WHEN 'I' THEN 'partitioned index'
               ELSE c.relkind::text
             END AS type
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = ANY($1)
      ORDER BY c.relname;
    `;

    const res = await client.query(sql, [targets]);
    if (res.rows.length === 0) {
      console.log('No matching relations found for targets:', targets.join(', '));
    } else {
      console.log('\nFound relations:');
      for (const row of res.rows) {
        console.log(`  - ${row.relname} [${row.type}]`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

run();