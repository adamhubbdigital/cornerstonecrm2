/*
  # Fix Task Assignments and User References

  1. Changes
    - Update task policies to handle assignments
    - Fix policy creation with IF NOT EXISTS
    - Ensure proper team-based access control

  2. Security
    - Maintain team-based access control
    - Ensure proper data relationships
*/

-- Update task policies
DROP POLICY IF EXISTS "Team members can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Team members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Team members can update tasks" ON tasks;

-- Create new policies for tasks
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

-- Create profiles policy if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;