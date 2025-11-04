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
    console.log(`Connecting to Postgres at ${DB_HOST}:${DB_PORT} ...`);
    await client.connect();
    console.log('Connected.');

    await client.query('BEGIN');

    // Ensure column exists
    console.log('Ensuring form_type column exists...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'interview_subject_templates' AND column_name = 'form_type'
        ) THEN
          ALTER TABLE public.interview_subject_templates ADD COLUMN form_type text;
        END IF;
      END $$;
    `);

    // Drop existing check constraint
    console.log('Dropping existing form_type CHECK constraint if any...');
    await client.query(`
      ALTER TABLE public.interview_subject_templates
      DROP CONSTRAINT IF EXISTS interview_subject_templates_form_type_check;
    `);

    // Remove invalid rows
    console.log('Deleting rows with invalid form_type values...');
    const delRes = await client.query(`
      DELETE FROM public.interview_subject_templates
      WHERE form_type IS NOT NULL AND form_type NOT IN ('kg_std', 'plus_one');
    `);
    console.log(`Deleted ${delRes.rowCount} invalid rows.`);

    // Recreate constraint
    console.log('Creating new form_type CHECK constraint...');
    await client.query(`
      ALTER TABLE public.interview_subject_templates
      ADD CONSTRAINT interview_subject_templates_form_type_check
      CHECK (form_type IN ('kg_std', 'plus_one'));
    `);

    await client.query('COMMIT');
    console.log('✅ Constraint fixed successfully.');
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('❌ Fix script error:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

run();