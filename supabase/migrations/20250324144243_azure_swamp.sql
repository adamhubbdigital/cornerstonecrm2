/*
  # Fix Task Assignments and Team Member Relationships

  1. Changes
    - Add assignee relationship to tasks table
    - Update team members relationship with profiles
    - Add proper foreign key constraints
    - Update RLS policies

  2. Security
    - Maintain team-based access control
    - Ensure proper data relationships
*/

-- First, ensure the profiles table exists and has proper constraints
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Add assignee_id to tasks if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks'
    AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE tasks
    ADD COLUMN assignee_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Set default assignee to created_by for existing tasks
UPDATE tasks
SET assignee_id = created_by
WHERE assignee_id IS NULL;

-- Make assignee_id NOT NULL
ALTER TABLE tasks
ALTER COLUMN assignee_id SET NOT NULL;

-- Update task policies to include assignee access
DROP POLICY IF EXISTS "Team members can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Team members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Team members can update tasks" ON tasks;

CREATE POLICY "Team members can view all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm1
      WHERE tm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM team_members tm2
        WHERE tm2.team_id = tm1.team_id
        AND (
          tm2.user_id = tasks.created_by OR
          tm2.user_id = tasks.assignee_id
        )
      )
    )
  );

CREATE POLICY "Team members can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm1
      WHERE tm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM team_members tm2
        WHERE tm2.team_id = tm1.team_id
        AND tm2.user_id = tasks.assignee_id
      )
    )
  );

CREATE POLICY "Team members can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm1
      WHERE tm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM team_members tm2
        WHERE tm2.team_id = tm1.team_id
        AND (
          tm2.user_id = tasks.created_by OR
          tm2.user_id = tasks.assignee_id
        )
      )
    )
  );

-- Create function to set default assignee if not provided
CREATE OR REPLACE FUNCTION set_default_assignee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NULL THEN
    NEW.assignee_id := NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default assignee
DROP TRIGGER IF EXISTS set_default_task_assignee ON tasks;
CREATE TRIGGER set_default_task_assignee
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_default_assignee();