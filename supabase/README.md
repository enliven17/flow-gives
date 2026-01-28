# Supabase Database Setup

This directory contains the database schema and migrations for the StacksGives crowdfunding platform.

## Database Schema

The database consists of two main tables:

### Projects Table
Stores crowdfunding project information including:
- Project details (title, description, image, category)
- Funding metrics (goal, total raised, contributor count)
- Status tracking (draft, active, funded, expired, cancelled)
- Timestamps (created, updated, published, deadline)

### Contributions Table
Stores contribution transactions including:
- Project reference
- Contributor wallet address
- Amount (in micro-USDCx)
- Blockchain transaction details (tx_id, block_height)
- Timestamp

## Features

### Automatic Triggers
- **update_project_metrics**: Automatically updates project funding metrics when a contribution is added
- **update_updated_at_column**: Automatically updates the updated_at timestamp on project changes

### Database Functions
- **check_expired_projects()**: Updates project status to 'expired' for projects past their deadline

### Row Level Security (RLS)
- Public projects (active, funded, expired) are viewable by everyone
- Draft projects are only viewable by their creators
- Users can only update/delete their own draft projects
- Contributions are viewable by everyone
- Only the system (service role) can insert contributions

### Performance Indexes
- Status-based filtering
- Fundraiser lookup
- Deadline queries
- Contribution aggregations
- Composite indexes for sorted listings

## Setup Instructions

### Option 1: Using Supabase Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste and run the SQL in the editor

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Apply migrations:
   ```bash
   supabase db push
   ```

### Option 3: Manual Migration

If you prefer to run migrations manually:

```bash
# Connect to your Supabase database using psql or any PostgreSQL client
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration file
\i supabase/migrations/001_initial_schema.sql
```

## Verification

After running the migration, verify the setup:

1. Check that tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('projects', 'contributions');
   ```

2. Check that indexes exist:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename IN ('projects', 'contributions');
   ```

3. Check that triggers exist:
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```

4. Check that RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('projects', 'contributions');
   ```

## Data Types

### Amount Storage
All monetary amounts are stored as BIGINT in micro-USDCx units:
- 1 USDCx = 1,000,000 micro-USDCx
- Example: $10.50 USDCx = 10,500,000 micro-USDCx

This approach avoids floating-point precision issues and matches the blockchain token decimals.

### Wallet Addresses
Stacks wallet addresses are stored as VARCHAR(50):
- Mainnet addresses start with "SP"
- Testnet addresses start with "ST"
- Example: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"

### Transaction IDs
Blockchain transaction IDs are stored as VARCHAR(100):
- Example: "0x1234567890abcdef..."

## Maintenance

### Regular Tasks

1. **Check for expired projects** (run daily via cron):
   ```sql
   SELECT check_expired_projects();
   ```

2. **Verify data integrity**:
   ```sql
   -- Check for orphaned contributions
   SELECT COUNT(*) FROM contributions c
   LEFT JOIN projects p ON c.project_id = p.id
   WHERE p.id IS NULL;
   
   -- Verify contributor counts
   SELECT p.id, p.contributor_count, COUNT(DISTINCT c.contributor_address) as actual_count
   FROM projects p
   LEFT JOIN contributions c ON p.id = c.project_id
   GROUP BY p.id, p.contributor_count
   HAVING p.contributor_count != COUNT(DISTINCT c.contributor_address);
   ```

3. **Monitor performance**:
   ```sql
   -- Check slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

## Troubleshooting

### Common Issues

1. **RLS blocking queries**: If you're getting permission errors, ensure you're using the correct client (anon key for public access, service role for admin operations).

2. **Trigger not firing**: Check that the trigger is enabled:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_project_metrics';
   ```

3. **Constraint violations**: Ensure data meets all constraints:
   - funding_goal > 0
   - amount > 0
   - status is one of: draft, active, funded, expired, cancelled
   - deadline > created_at

## Security Notes

- Never expose the service role key in client-side code
- Use the anon key for client-side operations
- RLS policies enforce data access rules
- All user inputs should be validated in the application layer
- Wallet addresses should be validated before storage
