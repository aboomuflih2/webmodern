import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

// Default to Supabase local dev ports per supabase/config.toml
const DB_HOST = process.env.DB_HOST || process.env.PGHOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || process.env.PGPORT || 54322);
const DB_USER = process.env.DB_USER || process.env.PGUSER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres';
const DB_DATABASE = process.env.DB_DATABASE || process.env.PGDATABASE || 'postgres';

async function query(client, sql, params = []) {
  const res = await client.query(sql, params);
  return res.rows;
}

async function run() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });

  try {
    console.log('Env check:', {
      DB_HOST,
      DB_PORT,
      DB_USER,
      DB_PASSWORD: DB_PASSWORD ? '***' : '(empty)',
      DB_DATABASE,
    });
    console.log(`Connecting to Postgres at ${DB_HOST}:${DB_PORT} as ${DB_USER} ...`);
    await client.connect();
    console.log('Connected.');

    console.log('\n== Table existence and RLS status ==');
    const tableInfo = await query(
      client,
      `SELECT c.relname AS table_name,
              n.nspname AS schema_name,
              c.relrowsecurity AS rls_enabled,
              pg_get_userbyid(c.relowner) AS table_owner
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = 'job_applications';`
    );
    if (tableInfo.length === 0) {
      console.log('Table public.job_applications does NOT exist.');
    } else {
      const t = tableInfo[0];
      console.log(`Table: ${t.schema_name}.${t.table_name}`);
      console.log(`Owner: ${t.table_owner}`);
      console.log(`RLS enabled: ${t.rls_enabled}`);
    }

    console.log('\n== Columns ==');
    const columns = await query(
      client,
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'job_applications'
       ORDER BY ordinal_position;`
    );
    if (columns.length === 0) {
      console.log('No columns found (table missing).');
    } else {
      for (const col of columns) {
        console.log(`${col.column_name} :: ${col.data_type} :: nullable=${col.is_nullable}`);
      }
    }

    console.log('\n== Policies ==');
    const policies = await query(
      client,
      `SELECT policyname AS policy_name,
              cmd AS command,
              permissive,
              roles,
              qual,
              with_check
       FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'job_applications'
       ORDER BY policyname, cmd;`
    );
    if (policies.length === 0) {
      console.log('No RLS policies found for public.job_applications.');
    } else {
      for (const p of policies) {
        console.log(`Policy: ${p.policy_name}`);
        console.log(`  Command: ${p.command}`);
        console.log(`  Permissive: ${p.permissive}`);
        console.log(`  Roles: ${Array.isArray(p.roles) ? p.roles.join(', ') : p.roles}`);
        console.log(`  USING: ${p.qual}`);
        console.log(`  WITH CHECK: ${p.with_check}`);
      }
    }

    console.log('\n== Grants ==');
    const grants = await query(
      client,
      `SELECT grantee, privilege_type
       FROM information_schema.role_table_grants
       WHERE table_schema = 'public' AND table_name = 'job_applications'
       ORDER BY grantee, privilege_type;`
    );
    if (grants.length === 0) {
      console.log('No table grants found for public.job_applications.');
    } else {
      for (const g of grants) {
        console.log(`${g.grantee} => ${g.privilege_type}`);
      }
    }

    console.log('\n== Storage policies (storage.objects) ==');
    const storagePolicies = await query(
      client,
      `SELECT polname AS policy_name, cmd AS command,
              array_agg(pg_get_userbyid(r.oid)) AS roles
       FROM pg_policies p
       LEFT JOIN pg_roles r ON r.oid = ANY(p.roles)
       WHERE p.schemaname = 'storage' AND p.tablename = 'objects'
       GROUP BY polname, cmd
       ORDER BY polname;`
    );
    if (storagePolicies.length === 0) {
      console.log('No storage.objects policies found or insufficient privileges.');
    } else {
      for (const sp of storagePolicies) {
        console.log(`Storage Policy: ${sp.policy_name} | Command: ${sp.command} | Roles: ${(sp.roles || []).join(', ')}`);
      }
    }

  } catch (e) {
    console.error('Inspector error:', e && (e.message || e.toString()));
    if (e && e.stack) {
      console.error(e.stack.split('\n').slice(0, 4).join('\n'));
    }
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

run();