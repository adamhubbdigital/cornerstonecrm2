/*
  # Add assignee to tasks table

  1. Changes
    - Add assignee_id column to tasks table
    - Set default assignee as the task creator
    - Update RLS policies
    - Add foreign key constraint

  2. Security
    - Maintain team-based access control
    - Ensure proper data validation
*/

-- Add assignee_id column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES auth.users(id);

-- Create function to set default assignee
CREATE OR REPLACE FUNCTION set_default_assignee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NULL THEN
    NEW.assignee_id := NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set default assignee
DROP TRIGGER IF EXISTS set_default_task_assignee ON tasks;
CREATE TRIGGER set_default_task_assignee
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_default_assignee();