/**
 * Add Contribution Trigger
 * 
 * Creates a database trigger to automatically update project metrics
 * when contributions are added
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

async function addContributionTrigger() {
  console.log('🔧 Creating contribution trigger...');

  const sql = `
-- Function to update project metrics when contributions change
CREATE OR REPLACE FUNCTION update_project_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update project's current_amount
  UPDATE projects
  SET 
    current_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM contributions
      WHERE project_id = NEW.project_id
    ),
    updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_project_metrics_on_contribution ON contributions;

-- Create trigger to update project metrics after contribution insert
CREATE TRIGGER trigger_update_project_metrics_on_contribution
AFTER INSERT ON contributions
FOR EACH ROW
EXECUTE FUNCTION update_project_metrics();
  `;

  console.log('Executing SQL...');
  console.log('Please run this SQL in Supabase SQL Editor:');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
  
  console.log('\n✅ Copy the SQL above and run it in Supabase SQL Editor');
  console.log('   Dashboard → SQL Editor → New Query → Paste → Run');
}

// Run the function
addContributionTrigger()
  .then(() => {
    console.log('\n🎉 Instructions displayed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
