#!/usr/bin/env node

/**
 * Add image_url column to projects table
 * 
 * This script adds the image_url column to the projects table
 * if it doesn't already exist.
 * 
 * Usage:
 *   tsx scripts/add-image-column.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addImageColumn() {
  console.log('📦 Adding image_url column to projects table...\n');

  try {
    // Check if column exists by trying to select it
    const { error: checkError } = await supabase
      .from('projects')
      .select('image_url')
      .limit(1);

    if (!checkError) {
      console.log('✅ Column image_url already exists');
      return;
    }

    // If column doesn't exist, we need to add it via SQL
    // Since Supabase JS doesn't support ALTER TABLE directly,
    // we'll provide instructions
    console.log('⚠️  Column image_url does not exist');
    console.log('\n📝 Please run this SQL in your Supabase Dashboard SQL Editor:');
    console.log('\nALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;');
    console.log('\nOr use Supabase CLI:');
    console.log('  supabase db push\n');
    
    // Try to use RPC if available (may not work in all setups)
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;'
      });
      
      if (!rpcError) {
        console.log('✅ Successfully added image_url column via RPC');
        return;
      }
    } catch (e) {
      // RPC not available, that's okay
    }

    console.log('\n💡 After adding the column, run:');
    console.log('   npm run add-images\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addImageColumn();
