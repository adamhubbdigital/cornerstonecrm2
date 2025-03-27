/*
  # Fix task policies to prevent infinite recursion

  1. Changes
    - Further simplify task policies to prevent any possibility of recursion
    - Use direct joins and simpler conditions
    - Maintain team-based access control

  2. Security
    - Maintain proper access control
    - Ensure users can only access tasks they should see
*/

-- Drop existing task policies
DROP POLICY IF EXISTS "Users can view team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update team tasks" ON tasks;

-- Create simplified policies with direct joins
CREATE POLICY "Users can view team tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    organisation_id IN (
      SELECT o.id
      FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE tm.user_id = auth.uid()
    ) OR
    contact_id IN (
      SELECT c.id
      FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (organisation_id IS NULL OR organisation_id IN (
      SELECT o.id
      FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE tm.user_id = auth.uid()
    )) AND
    (contact_id IS NULL OR contact_id IN (
      SELECT c.id
      FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update team tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    organisation_id IN (
      SELECT o.id
      FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE tm.user_id = auth.uid()
    ) OR
    contact_id IN (
      SELECT c.id
      FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    )
  );