/**
 * Test script to verify that the actual Supabase client files can be imported
 * and work correctly with the new credentials
 * 
 * This tests the actual lib/supabase/client.ts and lib/supabase/server.ts files
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testClientImports() {
  console.log('🔍 Testing actual Supabase client file imports...\n');

  try {
    // Test 1: Import and test server-side admin client
    console.log('Test 1: Importing server-side admin client...');
    
    // We need to set up the environment to simulate server-side
    const originalWindow = global.window;
    // @ts-ignore - Temporarily remove window to simulate server environment
    delete global.window;

    const { supabaseAdmin } = await import('../lib/supabase/server.js');
    
    // Test a query with the admin client
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Admin client query failed:', usersError.message);
      return false;
    }

    console.log('✅ Server-side admin client imported and working');
    console.log(`   Queried users table successfully\n`);

    // Restore window if it existed
    if (originalWindow !== undefined) {
      // @ts-ignore
      global.window = originalWindow;
    }

    // Test 2: Test that client file exists and has correct structure
    console.log('Test 2: Verifying client-side client file structure...');
    
    // Read the client file to verify it's configured correctly
    const fs = await import('fs');
    const clientContent = fs.readFileSync(
      resolve(process.cwd(), 'lib/supabase/client.ts'),
      'utf-8'
    );

    // Check for required imports and configuration
    const hasCreateClient = clientContent.includes('createClient');
    const hasDatabase = clientContent.includes('Database');
    const hasEnvVars = clientContent.includes('NEXT_PUBLIC_SUPABASE_URL') &&
                       clientContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    const hasAuthConfig = clientContent.includes('persistSession') &&
                          clientContent.includes('autoRefreshToken');

    if (!hasCreateClient || !hasDatabase || !hasEnvVars || !hasAuthConfig) {
      console.error('❌ Client file is missing required configuration');
      console.error(`   createClient: ${hasCreateClient}`);
      console.error(`   Database type: ${hasDatabase}`);
      console.error(`   Environment variables: ${hasEnvVars}`);
      console.error(`   Auth config: ${hasAuthConfig}`);
      return false;
    }

    console.log('✅ Client-side client file structure is correct\n');

    // Test 3: Verify server file structure
    console.log('Test 3: Verifying server-side client file structure...');
    
    const serverContent = fs.readFileSync(
      resolve(process.cwd(), 'lib/supabase/server.ts'),
      'utf-8'
    );

    const hasServerCreateClient = serverContent.includes('createClient');
    const hasServerDatabase = serverContent.includes('Database');
    const hasServiceKey = serverContent.includes('SUPABASE_SERVICE_ROLE_KEY');
    const hasWindowCheck = serverContent.includes('typeof window');
    const hasSingleton = serverContent.includes('supabaseAdmin');

    if (!hasServerCreateClient || !hasServerDatabase || !hasServiceKey || 
        !hasWindowCheck || !hasSingleton) {
      console.error('❌ Server file is missing required configuration');
      console.error(`   createClient: ${hasServerCreateClient}`);
      console.error(`   Database type: ${hasServerDatabase}`);
      console.error(`   Service key: ${hasServiceKey}`);
      console.error(`   Window check: ${hasWindowCheck}`);
      console.error(`   Singleton: ${hasSingleton}`);
      return false;
    }

    console.log('✅ Server-side client file structure is correct\n');

    console.log('✅ All client import tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Server admin client: ✅ Imported and working');
    console.log('   - Client file structure: ✅ Correct');
    console.log('   - Server file structure: ✅ Correct');
    console.log('   - Database connectivity: ✅ Verified');

    return true;
  } catch (error) {
    console.error('❌ Error during testing:', error);
    return false;
  }
}

// Run the test
testClientImports()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
