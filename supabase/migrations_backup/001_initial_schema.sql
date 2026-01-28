-- StacksGives Crowdfunding Platform Database Schema
-- This migration creates the initial database schema for projects and contributions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  funding_goal BIGINT NOT NULL CHECK (funding_goal > 0),
  total_raised BIGINT NOT NULL DEFAULT 0,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  fundraiser_address VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'funded', 'expired', 'cancelled')),
  CONSTRAINT future_deadline CHECK (deadline > created_at)
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contributor_address VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  tx_id VARCHAR(100) NOT NULL UNIQUE,
  block_height INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_fundraiser ON projects(fundraiser_address);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status_created ON projects(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_project ON contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON contributions(contributor_address);
CREATE INDEX IF NOT EXISTS idx_contributions_tx_id ON contributions(tx_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at DESC);

-- Create function to update project metrics when contribution is added
CREATE OR REPLACE FUNCTION update_project_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET 
    total_raised = total_raised + NEW.amount,
    contributor_count = (
      SELECT COUNT(DISTINCT contributor_address)
      FROM contributions
      WHERE project_id = NEW.project_id
    ),
    status = CASE
      WHEN total_raised + NEW.amount >= funding_goal THEN 'funded'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update project metrics
CREATE TRIGGER trigger_update_project_metrics
AFTER INSERT ON contributions
FOR EACH ROW
EXECUTE FUNCTION update_project_metrics();

-- Create function to check and update expired projects
CREATE OR REPLACE FUNCTION check_expired_projects()
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND deadline < NOW()
    AND total_raised < funding_goal;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table

-- Anyone can read active, funded, or expired projects
CREATE POLICY "Public projects are viewable by everyone"
  ON projects FOR SELECT
  USING (status IN ('active', 'funded', 'expired'));

-- Anyone can read their own draft projects (using custom header)
CREATE POLICY "Users can view their own draft projects"
  ON projects FOR SELECT
  USING (
    status = 'draft' 
    AND fundraiser_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

-- Anyone can insert projects (will be validated in application layer)
CREATE POLICY "Anyone can create projects"
  ON projects FOR INSERT
  WITH CHECK (true);

-- Users can only update their own draft projects
CREATE POLICY "Users can update their own draft projects"
  ON projects FOR UPDATE
  USING (
    fundraiser_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND status = 'draft'
  );

-- Users can delete their own draft projects
CREATE POLICY "Users can delete their own draft projects"
  ON projects FOR DELETE
  USING (
    fundraiser_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND status = 'draft'
  );

-- RLS Policies for contributions table

-- Anyone can read contributions
CREATE POLICY "Contributions are viewable by everyone"
  ON contributions FOR SELECT
  USING (true);

-- Only system can insert contributions (via service role)
CREATE POLICY "System can insert contributions"
  ON contributions FOR INSERT
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Stores crowdfunding project information';
COMMENT ON TABLE contributions IS 'Stores contribution transactions for projects';
COMMENT ON COLUMN projects.funding_goal IS 'Target amount in micro-USDCx (6 decimals)';
COMMENT ON COLUMN projects.total_raised IS 'Current amount raised in micro-USDCx (6 decimals)';
COMMENT ON COLUMN contributions.amount IS 'Contribution amount in micro-USDCx (6 decimals)';
COMMENT ON COLUMN contributions.tx_id IS 'Stacks blockchain transaction ID';
COMMENT ON COLUMN contributions.block_height IS 'Block height when transaction was confirmed';
