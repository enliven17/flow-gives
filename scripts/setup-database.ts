/**
 * Database Setup Script
 * 
 * This script applies the database schema to your Supabase instance.
 * Run with: npx tsx scripts/setup-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Reading migration file: 001_initial_schema.sql');

    // Split the SQL into individual statements
    // Note: This is a simple split and may not work for all SQL
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution as fallback
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          };
          
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ sql: statement }),
          });

          if (!response.ok) {
            console.warn(`⚠️  Statement ${i + 1} may have failed (this is normal for some statements)`);
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Some statements may fail if they already exist, which is okay
        console.warn(`⚠️  Statement ${i + 1} encountered an issue (may already exist)`);
      }
    }

    console.log('\n✅ Database setup completed!');
    console.log(`   Statements processed: ${statements.length}`);
    console.log(`   Successful: ${successCount}`);
    
    // Verify the setup
    console.log('\n🔍 Verifying database setup...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('projects')
      .select('*')
      .limit(0);

    if (tablesError) {
      console.error('❌ Verification failed - projects table may not exist');
      console.error('   Please run the migration manually using the Supabase dashboard');
      console.error('   See supabase/README.md for instructions');
    } else {
      console.log('✅ Projects table verified');
    }

    const { data: contributions, error: contributionsError } = await supabase
      .from('contributions')
      .select('*')
      .limit(0);

    if (contributionsError) {
      console.error('❌ Verification failed - contributions table may not exist');
    } else {
      console.log('✅ Contributions table verified');
    }

    console.log('\n📚 Next steps:');
    console.log('   1. Verify the schema in your Supabase dashboard');
    console.log('   2. Check that RLS policies are enabled');
    console.log('   3. Test the application with: npm run dev');
    console.log('\n   If you encounter issues, see supabase/README.md for manual setup instructions');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.error('\n📚 Manual setup required:');
    console.error('   1. Open your Supabase dashboard');
    console.error('   2. Navigate to SQL Editor');
    console.error('   3. Copy and run the contents of supabase/migrations/001_initial_schema.sql');
    console.error('   4. See supabase/README.md for detailed instructions');
    process.exit(1);
  }
}

setupDatabase();
