/**
 * Fix Contributor Count
 * 
 * Manually updates project metrics based on existing contributions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixContributorCount() {
  console.log('🔧 Fixing contributor counts...');

  try {
    // Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title');

    if (projectsError) {
      throw projectsError;
    }

    console.log(`Found ${projects?.length || 0} projects`);

    for (const project of projects || []) {
      // Get contributions for this project
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('amount, contributor_address')
        .eq('project_id', project.id);

      if (contribError) {
        console.error(`Error fetching contributions for ${project.id}:`, contribError);
        continue;
      }

      // Calculate total amount
      const totalAmount = contributions?.reduce((sum, c) => {
        return sum + BigInt(c.amount);
      }, 0n) || 0n;

      // Update project
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          current_amount: totalAmount.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (updateError) {
        console.error(`Error updating project ${project.id}:`, updateError);
        continue;
      }

      console.log(`✅ Updated ${project.title}:`);
      console.log(`   - Contributions: ${contributions?.length || 0}`);
      console.log(`   - Total: ${totalAmount.toString()} micro-FLOW`);
    }

    console.log('\n🎉 All projects updated!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the function
fixContributorCount()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
