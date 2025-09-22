import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyStorageMigrations() {
  console.log('🚀 Applying Storage Bucket Migrations\n');
  console.log('=' .repeat(60));

  // List of migration files that create storage buckets
  const migrationFiles = [
    '011_create_storage_buckets.sql',
    '017_enhanced_academic_programs_schema.sql', // Contains program-images and program-thumbnails
    '998_create_missing_photo_buckets.sql'
  ];

  try {
    // Check current buckets before applying migrations
    console.log('\n📦 Current buckets before migration:');
    const { data: beforeBuckets } = await supabase.storage.listBuckets();
    console.log(`   Found: ${beforeBuckets?.length || 0} buckets`);
    beforeBuckets?.forEach(bucket => console.log(`   - ${bucket.name}`));

    // Apply each migration file
    for (const migrationFile of migrationFiles) {
      const filePath = path.join('supabase', 'migrations', migrationFile);
      
      console.log(`\n🔧 Applying migration: ${migrationFile}`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found: ${filePath}`);
        continue;
      }

      try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL content by semicolons and execute each statement
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`   📝 Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement.trim()) {
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: statement });
              if (error) {
                // Try direct execution if RPC fails
                const { error: directError } = await supabase
                  .from('_temp')
                  .select('1')
                  .limit(0);
                
                // For storage operations, we need to use the storage API or raw SQL
                if (statement.includes('INSERT INTO storage.buckets')) {
                  console.log(`   ⚠️  Bucket creation statement detected, may need manual application`);
                  console.log(`      Statement: ${statement.substring(0, 100)}...`);
                } else if (statement.includes('CREATE POLICY')) {
                  console.log(`   ⚠️  Policy creation statement detected, may need manual application`);
                  console.log(`      Statement: ${statement.substring(0, 100)}...`);
                } else {
                  console.log(`   ❌ Error executing statement ${i + 1}: ${error?.message || 'Unknown error'}`);
                }
              } else {
                console.log(`   ✅ Statement ${i + 1} executed successfully`);
              }
            } catch (execError) {
              console.log(`   ⚠️  Statement ${i + 1} execution issue: ${execError.message}`);
            }
          }
        }
        
        console.log(`   ✅ Migration ${migrationFile} processing completed`);
        
      } catch (fileError) {
        console.error(`   ❌ Error reading migration file: ${fileError.message}`);
      }
    }

    // Check buckets after applying migrations
    console.log('\n📦 Buckets after migration:');
    const { data: afterBuckets } = await supabase.storage.listBuckets();
    console.log(`   Found: ${afterBuckets?.length || 0} buckets`);
    afterBuckets?.forEach(bucket => console.log(`   - ${bucket.name}`));

    // Show the difference
    const beforeCount = beforeBuckets?.length || 0;
    const afterCount = afterBuckets?.length || 0;
    const newBuckets = afterCount - beforeCount;
    
    console.log(`\n📊 Migration Results:`);
    console.log(`   Buckets before: ${beforeCount}`);
    console.log(`   Buckets after: ${afterCount}`);
    console.log(`   New buckets created: ${newBuckets}`);
    
    if (newBuckets > 0) {
      console.log(`   ✅ Successfully created ${newBuckets} new storage buckets!`);
    } else {
      console.log(`   ⚠️  No new buckets were created. This might indicate:`);
      console.log(`      - Buckets already exist`);
      console.log(`      - Migration statements need manual execution`);
      console.log(`      - Permission issues`);
    }

    // Final recommendation
    console.log(`\n💡 Recommendation:`);
    if (afterCount < 13) {
      console.log(`   You still have ${13 - afterCount} missing buckets.`);
      console.log(`   Consider applying migrations manually via Supabase Dashboard or SQL Editor.`);
      console.log(`   Required migrations:`);
      migrationFiles.forEach(file => console.log(`   - ${file}`));
    } else {
      console.log(`   ✅ All expected storage buckets are now present!`);
    }

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Storage migration process completed');
}

// Run the migration
applyStorageMigrations().catch(console.error);