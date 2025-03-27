/*
  # Fix task policies to prevent infinite recursion

  1. Changes
    - Simplify task policies to prevent infinite recursion
    - Maintain team-based access control
    - Optimize query performance

  2. Security
    - Maintain proper access control
    - Ensure users can only access tasks they should see
*/

-- Drop existing task policies
DROP POLICY IF EXISTS "Users can view team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update team tasks" ON tasks;

-- Create simplified policies that avoid recursion
CREATE POLICY "Users can view team tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE o.id = tasks.organisation_id 
      AND tm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 
      FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE c.id = tasks.contact_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (organisation_id IS NULL OR EXISTS (
      SELECT 1 
      FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE o.id = organisation_id 
      AND tm.user_id = auth.uid()
    )) AND
    (contact_id IS NULL OR EXISTS (
      SELECT 1 
      FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE c.id = contact_id 
      AND tm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update team tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE o.id = tasks.organisation_id 
      AND tm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 
      FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE c.id = tasks.contact_id 
      AND tm.user_id = auth.uid()
    )
  );