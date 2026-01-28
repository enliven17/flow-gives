/**
 * Set Project Contract ID
 * 
 * Sets the contract_id for the sample project
 * This is needed because smart contract uses UInt64 IDs
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

async function setContractId() {
  console.log('🔧 Setting contract IDs for projects...');

  try {
    // Get all projects without contract_id
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, contract_id')
      .is('contract_id', null);

    if (error) {
      throw error;
    }

    console.log(`Found ${projects?.length || 0} projects without contract_id`);

    // Assign sequential contract IDs starting from 1
    let nextId = 1;

    for (const project of projects || []) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ contract_id: nextId })
        .eq('id', project.id);

      if (updateError) {
        console.error(`Error updating project ${project.id}:`, updateError);
        continue;
      }

      console.log(`✅ Set contract_id=${nextId} for "${project.title}"`);
      nextId++;
    }

    console.log('\n🎉 All projects updated!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the function
setContractId()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
