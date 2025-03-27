/*
  # Update task policies for team-based access

  1. Changes
    - Update task policies to use team-based access
    - Align with organization and contact policies
    - Maintain proper access control

  2. Security
    - Enable team-based access for tasks
    - Maintain existing security model
    - Prevent infinite recursion
*/

-- Update tasks policies to use team-based access
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;

CREATE POLICY "Users can view team tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    organisation_id IN (
      SELECT id FROM organisations 
      WHERE team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
      )
    ) OR
    contact_id IN (
      SELECT id FROM contacts
      WHERE team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
      )
    ) OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can insert team tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (organisation_id IS NULL OR organisation_id IN (
      SELECT id FROM organisations 
      WHERE team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
      )
    )) AND
    (contact_id IS NULL OR contact_id IN (
      SELECT id FROM contacts
      WHERE team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can update team tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    organisation_id IN (
      SELECT id FROM organisations 
      WHERE team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
      )
    ) OR
    contact_id IN (
      SELECT id FROM contacts
      WHERE team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
      )
    )
  );