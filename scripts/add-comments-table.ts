/**
 * Add Comments Table
 * 
 * Creates the comments table in Supabase database
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

async function addCommentsTable() {
  console.log('📝 Creating comments table...');

  try {
    // Create comments table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create comments table if it doesn't exist
        CREATE TABLE IF NOT EXISTS comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL,
          author_address TEXT NOT NULL,
          content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
          parent_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT fk_comment_project FOREIGN KEY (project_id) 
            REFERENCES projects(id) ON DELETE CASCADE,
          CONSTRAINT fk_comment_author FOREIGN KEY (author_address) 
            REFERENCES users(wallet_address) ON DELETE CASCADE,
          CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) 
            REFERENCES comments(id) ON DELETE CASCADE
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
        CREATE INDEX IF NOT EXISTS idx_comments_author_address ON comments(author_address);
        CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

        -- Enable RLS
        ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
        DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
        DROP POLICY IF EXISTS "Authors can update their own comments" ON comments;
        DROP POLICY IF EXISTS "Authors can delete their own comments" ON comments;

        -- Create RLS policies
        CREATE POLICY "Comments are viewable by everyone"
          ON comments FOR SELECT
          USING (true);

        CREATE POLICY "Anyone can create comments"
          ON comments FOR INSERT
          WITH CHECK (true);

        CREATE POLICY "Authors can update their own comments"
          ON comments FOR UPDATE
          USING (author_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

        CREATE POLICY "Authors can delete their own comments"
          ON comments FOR DELETE
          USING (author_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
      `
    });

    if (error) {
      // Try direct SQL execution
      console.log('Trying direct table creation...');
      
      const { error: createError } = await supabase
        .from('comments')
        .select('id')
        .limit(1);

      if (createError && createError.message.includes('does not exist')) {
        console.error('❌ Comments table does not exist and could not be created');
        console.log('Please run this SQL manually in Supabase SQL Editor:');
        console.log(`
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_author_address ON comments(author_address);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON comments FOR INSERT WITH CHECK (true);
        `);
        process.exit(1);
      }
    }

    console.log('✅ Comments table created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the function
addCommentsTable()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
