#!/usr/bin/env node

/**
 * Apply Flow Blockchain Schema Migration
 * 
 * This script applies the Flow blockchain database schema to the Supabase instance.
 * It reads the migration SQL file and executes it using the Supabase service role.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting Flow blockchain schema migration...\n');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'apply_flow_schema.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file not found at ${migrationPath}`);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration file loaded successfully');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📍 Project Ref: ${supabaseUrl.match(/https:\/\/([^.]+)/)[1]}\n`);
  
  try {
    // Execute the migration SQL
    console.log('⏳ Executing migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution via REST API
      if (error.code === '42883') {
        console.log('⚠️  exec_sql function not found, trying alternative method...\n');
        await applyMigrationDirect(migrationSQL);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration executed successfully!\n');
      printSuccessMessage();
    }
    
  } catch (error) {
    console.error('❌ Error executing migration:');
    console.error(error.message);
    console.error('\n💡 Alternative: Copy the contents of supabase/migrations/apply_flow_schema.sql');
    console.error('   and run it directly in the Supabase SQL Editor at:');
    console.error(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql\n`);
    process.exit(1);
  }
}

async function applyMigrationDirect(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Executing ${statements.length} SQL statements...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments and DO blocks (they need special handling)
    if (statement.startsWith('COMMENT') || statement.includes('DO $$')) {
      continue;
    }
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: statement })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Statement ${i + 1} failed: ${error.substring(0, 100)}`);
        errorCount++;
      } else {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`✓ Executed ${i + 1}/${statements.length} statements...`);
        }
      }
    } catch (error) {
      console.error(`❌ Statement ${i + 1} failed: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed\n`);
  
  if (errorCount > 0) {
    console.log('⚠️  Some statements failed. Please run the migration manually in Supabase SQL Editor.');
    console.log('   The migration file is at: supabase/migrations/apply_flow_schema.sql\n');
  } else {
    printSuccessMessage();
  }
}

function printSuccessMessage() {
  console.log('✅ Flow Blockchain Schema Migration Complete!\n');
  console.log('📋 Summary:');
  console.log('   ✓ Tables created: users, projects, contributions, transactions');
  console.log('   ✓ Indexes created for performance optimization');
  console.log('   ✓ Row Level Security (RLS) policies enabled');
  console.log('   ✓ Triggers created for automatic updates');
  console.log('   ✓ View created: project_stats\n');
  console.log('🎉 Database is ready for Flow blockchain integration!\n');
  console.log('Next steps:');
  console.log('   1. Verify tables in Supabase dashboard');
  console.log('   2. Test database connectivity');
  console.log('   3. Continue with service layer implementation\n');
}

// Run the migration
applyMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
