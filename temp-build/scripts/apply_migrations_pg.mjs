import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

// Basic connection config for local Supabase Postgres
// Defaults match `supabase start` local stack
const DB_HOST = process.env.PGHOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.PGPORT || '54322', 10);
const DB_USER = process.env.PGUSER || 'postgres';
const DB_PASSWORD = process.env.PGPASSWORD || 'postgres';
const DB_DATABASE = process.env.PGDATABASE || 'postgres';

const MIGRATIONS_DIR = path.resolve('supabase', 'migrations');

async function run() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });

  try {
    console.log(`Connecting to Postgres at ${DB_HOST}:${DB_PORT} as ${DB_USER} ...`);
    await client.connect();
    console.log('Connected.');

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      throw new Error(`Migrations folder not found: ${MIGRATIONS_DIR}`);
    }

    // Collect and sort .sql files by filename
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.toLowerCase().endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');

      console.log(`\n-- Applying migration: ${file}`);
      try {
        // Run entire file in a single transaction for safety
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✔ Applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.warn(`⚠ Failed to apply ${file}: ${err.message}`);
        // Continue to next migration so idempotent/missing pieces still proceed
      }
    }

    console.log('\nAll migrations attempted.');
  } catch (e) {
    console.error('Migration runner error:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

run();

