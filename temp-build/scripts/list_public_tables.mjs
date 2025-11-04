import { Client } from 'pg';

// Basic connection config for local Supabase Postgres (matches `supabase start` defaults)
const DB_HOST = process.env.PGHOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.PGPORT || '54322', 10);
const DB_USER = process.env.PGUSER || 'postgres';
const DB_PASSWORD = process.env.PGPASSWORD || 'postgres';
const DB_DATABASE = process.env.PGDATABASE || 'postgres';

// Expected tables based on migration files and verification scripts
const expectedTables = [
  'admission_forms',
  'job_applications',
  'gate_pass_requests',
  'news',
  'news_posts',
  'academic_programs',
  'board_members',
  'school_features',
  'tickets',
  'user_roles',
  'hero_slides',
  'breaking_news',
  'contact_submissions',
  'events',
  'gallery_photos',
  'interview_subject_templates',
  'interview_subjects',
  'kg_std_applications',
  'leadership_messages',
  'page_content',
  'plus_one_applications',
  'school_stats',
  'social_media_links',
  'staff_counts',
  'testimonials',
  'article_comments',
  'article_likes',
  'contact_page_content',
  'contact_addresses',
  'contact_locations'
];

async function listPublicTables() {
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

    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const res = await client.query(sql);
    const tables = res.rows.map(r => r.table_name);

    console.log(`\nPublic tables count: ${tables.length}`);
    tables.forEach((t, i) => console.log(`  ${String(i + 1).padStart(2, ' ')}. ${t}`));

    // Comparison with expected list
    const missing = expectedTables.filter(t => !tables.includes(t));
    const extra = tables.filter(t => !expectedTables.includes(t));

    console.log('\nComparison against expected 30 tables:');
    console.log(`  Expected: ${expectedTables.length}`);
    console.log(`  Found:    ${tables.length}`);
    console.log(`  Missing:  ${missing.length}`);
    console.log(`  Extra:    ${extra.length}`);

    if (missing.length > 0) {
      console.log('\nMissing tables:');
      missing.forEach(t => console.log(`  - ${t}`));
    }

    if (extra.length > 0) {
      console.log('\nExtra tables:');
      extra.forEach(t => console.log(`  - ${t}`));
    }

  } catch (e) {
    console.error('Error listing public tables:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

listPublicTables();