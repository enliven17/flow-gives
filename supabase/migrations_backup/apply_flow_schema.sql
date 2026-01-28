-- Flow Blockchain Migration Schema
-- This migration updates the database schema for Flow blockchain compatibility
-- Run this script directly in the Supabase SQL Editor or via psql
-- Requirements: 5.1, 5.5, 5.6, 5.7, 5.8

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS project_stats CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
-- Stores Flow wallet addresses (0x-prefixed hex format)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_wallet_address UNIQUE (wallet_address),
  CONSTRAINT valid_flow_address CHECK (wallet_address ~ '^0x[a-fA-F0-9]{16}$')
);

-- Create projects table
-- Stores crowdfunding project information with Flow token amounts
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id BIGINT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount BIGINT NOT NULL CHECK (goal_amount > 0),
  current_amount BIGINT NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline TIMESTAMPTZ NOT NULL,
  creator_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'funded', 'expired', 'withdrawn')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_creator FOREIGN KEY (creator_address) 
    REFERENCES users(wallet_address) ON DELETE CASCADE,
  CONSTRAINT valid_deadline CHECK (deadline > created_at),
  CONSTRAINT valid_amounts CHECK (current_amount <= goal_amount * 2), -- Allow some overfunding
  CONSTRAINT valid_creator_address CHECK (creator_address ~ '^0x[a-fA-F0-9]{16}$')
);

-- Create contributions table
-- Stores contribution transactions with Flow token amounts
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contributor_address TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  tx_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_contributor FOREIGN KEY (contributor_address) 
    REFERENCES users(wallet_address) ON DELETE CASCADE,
  CONSTRAINT valid_contributor_address CHECK (contributor_address ~ '^0x[a-fA-F0-9]{16}$')
);

-- Create transactions table
-- Tracks Flow blockchain transaction lifecycle
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id TEXT UNIQUE NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('create_project', 'contribute', 'withdraw', 'refund')),
  wallet_address TEXT NOT NULL,
  project_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT valid_wallet_address CHECK (wallet_address ~ '^0x[a-fA-F0-9]{16}$')
);

-- Create indexes for performance optimization
-- Projects indexes
CREATE INDEX idx_projects_contract_id ON projects(contract_id);
CREATE INDEX idx_projects_creator_address ON projects(creator_address);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_current_amount ON projects(current_amount);
CREATE INDEX idx_projects_goal_amount ON projects(goal_amount);

-- Contributions indexes
CREATE INDEX idx_contributions_project_id ON contributions(project_id);
CREATE INDEX idx_contributions_contributor_address ON contributions(contributor_address);
CREATE INDEX idx_contributions_tx_hash ON contributions(tx_hash);
CREATE INDEX idx_contributions_created_at ON contributions(created_at DESC);
CREATE INDEX idx_contributions_amount ON contributions(amount);

-- Transactions indexes
CREATE INDEX idx_transactions_wallet_address ON transactions(wallet_address);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_tx_id ON transactions(tx_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_tx_type ON transactions(tx_type);

-- Users indexes
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Anyone can read users (for wallet address lookups)
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Anyone can insert users (when they first connect wallet)
CREATE POLICY "Anyone can create users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Users can update their own records
CREATE POLICY "Users can update their own records"
  ON users FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for projects table
-- Anyone can read active, funded, or expired projects
CREATE POLICY "Public projects are viewable by everyone"
  ON projects FOR SELECT
  USING (status IN ('active', 'funded', 'expired'));

-- Creators can view their own projects (including withdrawn)
CREATE POLICY "Creators can view their own projects"
  ON projects FOR SELECT
  USING (
    creator_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

-- Anyone can insert projects (will be validated in application layer)
CREATE POLICY "Anyone can create projects"
  ON projects FOR INSERT
  WITH CHECK (true);

-- Creators can update their own active projects
CREATE POLICY "Creators can update their own active projects"
  ON projects FOR UPDATE
  USING (
    creator_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND status = 'active'
  );

-- System can update any project (for sync service)
CREATE POLICY "System can update projects"
  ON projects FOR UPDATE
  USING (true);

-- RLS Policies for contributions table
-- Anyone can read contributions
CREATE POLICY "Contributions are viewable by everyone"
  ON contributions FOR SELECT
  USING (true);

-- System can insert contributions (via service role)
CREATE POLICY "System can insert contributions"
  ON contributions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for transactions table
-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

-- System can view all transactions
CREATE POLICY "System can view all transactions"
  ON transactions FOR SELECT
  USING (true);

-- System can insert and update transactions
CREATE POLICY "System can manage transactions"
  ON transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update project current_amount when contributions are added
CREATE OR REPLACE FUNCTION update_project_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM contributions
    WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update project current_amount on contribution insert
CREATE TRIGGER trigger_update_project_amount
  AFTER INSERT ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_project_current_amount();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores Flow wallet addresses (0x-prefixed hex format)';
COMMENT ON TABLE projects IS 'Stores crowdfunding project information with Flow token amounts';
COMMENT ON TABLE contributions IS 'Stores contribution transactions for projects with Flow tokens';
COMMENT ON TABLE transactions IS 'Tracks Flow blockchain transaction status';

COMMENT ON COLUMN users.wallet_address IS 'Flow wallet address (0x + 16 hex characters)';

COMMENT ON COLUMN projects.contract_id IS 'Smart contract project ID from Flow blockchain';
COMMENT ON COLUMN projects.goal_amount IS 'Target amount in micro-Flow (8 decimals, 100000000 = 1 FLOW)';
COMMENT ON COLUMN projects.current_amount IS 'Current amount raised in micro-Flow (8 decimals)';
COMMENT ON COLUMN projects.creator_address IS 'Flow wallet address of project creator';
COMMENT ON COLUMN projects.status IS 'Project status: active, funded, expired, or withdrawn';

COMMENT ON COLUMN contributions.amount IS 'Contribution amount in micro-Flow (8 decimals, 100000000 = 1 FLOW)';
COMMENT ON COLUMN contributions.tx_hash IS 'Flow blockchain transaction ID';
COMMENT ON COLUMN contributions.contributor_address IS 'Flow wallet address of contributor';

COMMENT ON COLUMN transactions.tx_id IS 'Flow blockchain transaction ID';
COMMENT ON COLUMN transactions.tx_type IS 'Type of transaction: create_project, contribute, withdraw, refund';
COMMENT ON COLUMN transactions.wallet_address IS 'Flow wallet address that initiated the transaction';
COMMENT ON COLUMN transactions.status IS 'Transaction status: pending, confirmed, or failed';

-- Create view for project statistics
CREATE OR REPLACE VIEW project_stats AS
SELECT 
  p.id,
  p.contract_id,
  p.title,
  p.creator_address,
  p.goal_amount,
  p.current_amount,
  p.deadline,
  p.status,
  COUNT(DISTINCT c.contributor_address) as contributor_count,
  COUNT(c.id) as contribution_count,
  ROUND((p.current_amount::NUMERIC / p.goal_amount::NUMERIC) * 100, 2) as percent_funded,
  EXTRACT(EPOCH FROM (p.deadline - NOW())) as seconds_remaining,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN contributions c ON p.id = c.project_id
GROUP BY p.id;

COMMENT ON VIEW project_stats IS 'Aggregated statistics for projects including contributor count and funding percentage';

-- Grant permissions for the view
GRANT SELECT ON project_stats TO anon;
GRANT SELECT ON project_stats TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Flow blockchain schema migration completed successfully!';
  RAISE NOTICE 'Tables created: users, projects, contributions, transactions';
  RAISE NOTICE 'Indexes created for performance optimization';
  RAISE NOTICE 'Row Level Security (RLS) policies enabled';
  RAISE NOTICE 'Triggers created for automatic updates';
  RAISE NOTICE 'View created: project_stats';
END $$;
