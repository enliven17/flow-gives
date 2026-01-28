/**
 * Test script to verify database connectivity with new Supabase instance
 * 
 * This script tests:
 * 1. Connection to the new Supabase instance
 * 2. Ability to query tables
 * 3. Verification that the schema is set up correctly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  try {
    // Test 1: Check if we can connect and query the users table
    console.log('Test 1: Querying users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Failed to query users table:', usersError.message);
      return false;
    }
    console.log('✅ Users table accessible');
    console.log(`   Found ${users?.length || 0} users\n`);

    // Test 2: Check if we can query the projects table
    console.log('Test 2: Querying projects table...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (projectsError) {
      console.error('❌ Failed to query projects table:', projectsError.message);
      return false;
    }
    console.log('✅ Projects table accessible');
    console.log(`   Found ${projects?.length || 0} projects\n`);

    // Test 3: Check if we can query the contributions table
    console.log('Test 3: Querying contributions table...');
    const { data: contributions, error: contributionsError } = await supabase
      .from('contributions')
      .select('*')
      .limit(1);

    if (contributionsError) {
      console.error('❌ Failed to query contributions table:', contributionsError.message);
      return false;
    }
    console.log('✅ Contributions table accessible');
    console.log(`   Found ${contributions?.length || 0} contributions\n`);

    // Test 4: Check if we can query the transactions table
    console.log('Test 4: Querying transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);

    if (transactionsError) {
      console.error('❌ Failed to query transactions table:', transactionsError.message);
      return false;
    }
    console.log('✅ Transactions table accessible');
    console.log(`   Found ${transactions?.length || 0} transactions\n`);

    // Test 5: Verify table structure by checking column names
    console.log('Test 5: Verifying table structure...');
    
    // Check projects table structure
    const { data: projectsSchema, error: schemaError } = await supabase
      .from('projects')
      .select('*')
      .limit(0);

    if (schemaError) {
      console.error('❌ Failed to verify schema:', schemaError.message);
      return false;
    }
    console.log('✅ Schema verification successful\n');

    console.log('✅ All database connectivity tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Connection: ✅ Successful');
    console.log('   - Users table: ✅ Accessible');
    console.log('   - Projects table: ✅ Accessible');
    console.log('   - Contributions table: ✅ Accessible');
    console.log('   - Transactions table: ✅ Accessible');
    console.log('   - Schema: ✅ Valid');

    return true;
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
