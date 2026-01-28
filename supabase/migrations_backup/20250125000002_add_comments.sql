-- Add comments table for project discussions
-- This migration adds comment functionality to projects

-- Create comments table (without foreign keys first)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  author_address TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  parent_id UUID, -- For nested replies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 2000)
);

-- Add foreign key constraints separately
-- This ensures the constraints are added even if the table already exists

-- Add project foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_comments_project' 
    AND table_name = 'comments'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT fk_comments_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add author foreign key (references users.wallet_address)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_comments_author' 
    AND table_name = 'comments'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT fk_comments_author 
    FOREIGN KEY (author_address) 
    REFERENCES users(wallet_address) ON DELETE CASCADE;
  END IF;
END $$;

-- Add parent foreign key (self-referencing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_comments_parent' 
    AND table_name = 'comments'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT fk_comments_parent 
    FOREIGN KEY (parent_id) 
    REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_address ON comments(author_address);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to avoid errors)
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments table (drop first if exists)

-- Anyone can read comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

-- Anyone can create comments (authenticated via wallet)
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Users can only update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (author_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (author_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can only delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (author_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Add comments
COMMENT ON TABLE comments IS 'Stores user comments on projects';
COMMENT ON COLUMN comments.content IS 'Comment text content (max 2000 characters)';
COMMENT ON COLUMN comments.parent_id IS 'Parent comment ID for nested replies';
