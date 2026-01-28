-- Add trigger to update project metrics when contribution is added
-- Supports both old schema (total_raised, funding_goal) and new schema (current_amount, goal_amount)

-- Create or replace function to update project metrics
CREATE OR REPLACE FUNCTION update_project_metrics()
RETURNS TRIGGER AS $$
DECLARE
  has_current_amount BOOLEAN;
  has_total_raised BOOLEAN;
BEGIN
  -- Check which schema columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'current_amount'
  ) INTO has_current_amount;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'total_raised'
  ) INTO has_total_raised;

  -- Update using new schema (current_amount, goal_amount)
  IF has_current_amount THEN
    UPDATE projects
    SET 
      current_amount = current_amount + NEW.amount,
      status = CASE
        WHEN current_amount + NEW.amount >= goal_amount THEN 'funded'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.project_id;
  -- Fallback to old schema (total_raised, funding_goal)
  ELSIF has_total_raised THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_project_metrics ON contributions;

-- Create trigger to automatically update project metrics
CREATE TRIGGER trigger_update_project_metrics
AFTER INSERT ON contributions
FOR EACH ROW
EXECUTE FUNCTION update_project_metrics();
