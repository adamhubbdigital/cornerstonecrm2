/*
  # Fix Task Assignments and Profile Relationships

  1. Changes
    - Add proper foreign key constraints
    - Update task policies
    - Fix profile relationships

  2. Security
    - Maintain team-based access control
    - Ensure proper data relationships
*/

-- Drop existing foreign key constraints
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

-- Add proper foreign key constraints
ALTER TABLE tasks
ADD CONSTRAINT tasks_assignee_id_fkey
FOREIGN KEY (assignee_id) REFERENCES auth.users(id);

ALTER TABLE team_members
ADD CONSTRAINT team_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Update task policies
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