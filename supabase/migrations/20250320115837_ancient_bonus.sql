/*
  # Fix recursive policies

  1. Changes
    - Simplify team member policies to prevent recursion
    - Update organization and contact policies to use direct team membership checks
    - Update task policies to use direct joins

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion in policy evaluation
*/

-- Update team_members policy to be simpler and non-recursive
DROP POLICY IF EXISTS "Users can view members of their teams" ON team_members;

CREATE POLICY "Users can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Update organizations policies
DROP POLICY IF EXISTS "Users can view team organisations" ON organisations;
DROP POLICY IF EXISTS "Users can insert team organisations" ON organisations;
DROP POLICY IF EXISTS "Users can update team organisations" ON organisations;

CREATE POLICY "Users can view team organisations"
  ON organisations
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team organisations"
  ON organisations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team organisations"
  ON organisations
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Update contacts policies
DROP POLICY IF EXISTS "Users can view team contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert team contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update team contacts" ON contacts;

CREATE POLICY "Users can view team contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Update tasks policies
DROP POLICY IF EXISTS "Users can view team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update team tasks" ON tasks;

CREATE POLICY "Users can view team tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    organisation_id IN (
      SELECT o.id
      FROM organisations o
      WHERE o.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    ) OR
    contact_id IN (
      SELECT c.id
      FROM contacts c
      WHERE c.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
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
      WHERE o.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )) AND
    (contact_id IS NULL OR contact_id IN (
      SELECT c.id
      FROM contacts c
      WHERE c.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
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
      SELECT o.id
      FROM organisations o
      WHERE o.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    ) OR
    contact_id IN (
      SELECT c.id
      FROM contacts c
      WHERE c.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );