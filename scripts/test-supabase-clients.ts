/**
 * Test script to verify Supabase client initialization
 * 
 * This script tests:
 * 1. Client-side Supabase client configuration
 * 2. Server-side Supabase admin client configuration
 * 3. Environment variable loading
 * 4. Database connectivity through both clients
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testSupabaseClients() {
  console.log('🔍 Testing Supabase client initialization...\n');

  // Test 1: Verify environment variables are loaded
  console.log('Test 1: Checking environment variables...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    return false;
  }
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    return false;
  }
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    return false;
  }

  console.log('✅ All environment variables are set');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...\n`);

  // Test 2: Test server-side client (admin)
  console.log('Test 2: Testing server-side admin client...');
  try {
    // Dynamically import to avoid client-side execution issues
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test a simple query
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Admin client query failed:', error.message);
      return false;
    }

    console.log('✅ Server-side admin client working correctly\n');
  } catch (error) {
    console.error('❌ Failed to initialize admin client:', error);
    return false;
  }

  // Test 3: Test client-side client (anon)
  console.log('Test 3: Testing client-side anon client...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    // Test a simple query
    const { data, error } = await supabaseClient
      .from('projects')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Client query failed:', error.message);
      return false;
    }

    console.log('✅ Client-side anon client working correctly\n');
  } catch (error) {
    console.error('❌ Failed to initialize client:', error);
    return false;
  }

  // Test 4: Verify URL format
  console.log('Test 4: Verifying Supabase URL format...');
  const urlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
  if (!urlPattern.test(supabaseUrl)) {
    console.error('❌ Invalid Supabase URL format');
    console.error(`   Expected: https://[project-ref].supabase.co`);
    console.error(`   Got: ${supabaseUrl}`);
    return false;
  }
  console.log('✅ Supabase URL format is valid\n');

  // Test 5: Verify JWT token format
  console.log('Test 5: Verifying JWT token format...');
  const jwtPattern = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  
  if (!jwtPattern.test(supabaseAnonKey)) {
    console.error('❌ Invalid anon key JWT format');
    return false;
  }
  if (!jwtPattern.test(supabaseServiceKey)) {
    console.error('❌ Invalid service key JWT format');
    return false;
  }
  console.log('✅ JWT tokens are valid\n');

  console.log('✅ All Supabase client tests passed!');
  console.log('\n📊 Summary:');
  console.log('   - Environment variables: ✅ Loaded');
  console.log('   - Server-side admin client: ✅ Working');
  console.log('   - Client-side anon client: ✅ Working');
  console.log('   - URL format: ✅ Valid');
  console.log('   - JWT tokens: ✅ Valid');

  return true;
}

// Run the test
testSupabaseClients()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
