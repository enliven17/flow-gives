// Verify Supabase schema creation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySchema() {
  console.log('🔍 Verifying Supabase schema...\n');

  try {
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) throw new Error(`Users table error: ${usersError.message}`);
    console.log('✅ Users table exists');

    // Check projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) throw new Error(`Projects table error: ${projectsError.message}`);
    console.log('✅ Projects table exists');

    // Check contributions table
    const { data: contributions, error: contributionsError } = await supabase
      .from('contributions')
      .select('*')
      .limit(1);
    
    if (contributionsError) throw new Error(`Contributions table error: ${contributionsError.message}`);
    console.log('✅ Contributions table exists');

    // Check transactions table
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) throw new Error(`Transactions table error: ${transactionsError.message}`);
    console.log('✅ Transactions table exists');

    // Check project_stats view
    const { data: stats, error: statsError } = await supabase
      .from('project_stats')
      .select('*')
      .limit(1);
    
    if (statsError) throw new Error(`Project stats view error: ${statsError.message}`);
    console.log('✅ Project stats view exists');

    console.log('\n✅ All database tables and views created successfully!');
    console.log('\nDatabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
  } catch (error) {
    console.error('\n❌ Schema verification failed:', error.message);
    process.exit(1);
  }
}

verifySchema();
