import { Client } from 'pg';

const DB_HOST = process.env.PGHOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.PGPORT || '54322', 10);
const DB_USER = process.env.PGUSER || 'postgres';
const DB_PASSWORD = process.env.PGPASSWORD || 'postgres';
const DB_DATABASE = process.env.PGDATABASE || 'postgres';

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
    console.log(`Connected to PostgreSQL at ${DB_HOST}:${DB_PORT}`);

    const constraints = await client.query(`
      SELECT c.conname AS name, pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'interview_subject_templates'
        AND n.nspname = 'public'
        AND c.contype = 'c';
    `);

    console.log('\nCHECK constraints on interview_subject_templates:');
    for (const row of constraints.rows) {
      console.log(`- ${row.name}: ${row.definition}`);
    }

    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'interview_subject_templates'
      ORDER BY ordinal_position;
    `);

    console.log('\nColumns:');
    for (const row of columns.rows) {
      console.log(`- ${row.column_name} (${row.data_type}) nullable=${row.is_nullable}`);
    }

  } catch (e) {
    console.error('Inspection error:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

run();