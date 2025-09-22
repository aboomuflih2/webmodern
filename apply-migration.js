import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying form_type column migration...');
  
  try {
    // First, let's check the current table structure
    console.log('Checking current table structure...');
    
    // Try to add the form_type column directly
    console.log('Adding form_type column...');
    const { data: addColumnData, error: addColumnError } = await supabase
      .rpc('exec', {
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'interview_subject_templates' 
              AND column_name = 'form_type'
            ) THEN
              ALTER TABLE public.interview_subject_templates 
              ADD COLUMN form_type text;
              
              ALTER TABLE public.interview_subject_templates 
              ADD CONSTRAINT check_form_type CHECK (form_type IN ('kg_std','plus_one'));
              
              UPDATE public.interview_subject_templates 
              SET form_type = 'kg_std' 
              WHERE form_type IS NULL;
              
              ALTER TABLE public.interview_subject_templates 
              ALTER COLUMN form_type SET NOT NULL;
              
              RAISE NOTICE 'Added form_type column successfully';
            ELSE
              RAISE NOTICE 'form_type column already exists';
            END IF;
          END $$;
        `
      });
    
    if (addColumnError) {
      console.error('Error adding form_type column:', addColumnError);
      
      // Try alternative approach - direct table alteration
      console.log('Trying alternative approach...');
      const { data, error } = await supabase
        .from('interview_subject_templates')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Table access error:', error);
      } else {
        console.log('Table exists and is accessible');
        console.log('Current columns in first row:', Object.keys(data[0] || {}));
      }
    } else {
      console.log('✅ Form type column added successfully!');
    }
    
    console.log('\n✅ Migration process completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();