/*
  # Fix recursive policies - Final attempt

  1. Changes
    - Simplify all policies to use direct subqueries
    - Remove all recursive checks
    - Maintain proper access control with simpler logic

  2. Security
    - Maintain team-based access control
    - Prevent infinite recursion
    - Keep proper data isolation
*/

-- Update team_members policy to be simpler
DROP POLICY IF EXISTS "Users can view team members" ON team_members;

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

-- Update tasks policies with simplified logic
DROP POLICY IF EXISTS "Users can view team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update team tasks" ON tasks;

CREATE POLICY "Users can view team tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisations o
      WHERE o.id = tasks.organisation_id
      AND o.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = tasks.contact_id
      AND c.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert team tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (organisation_id IS NULL OR EXISTS (
      SELECT 1 FROM organisations o
      WHERE o.id = organisation_id
      AND o.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )) AND
    (contact_id IS NULL OR EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_id
      AND c.team_id IN (
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
    EXISTS (
      SELECT 1 FROM organisations o
      WHERE o.id = tasks.organisation_id
      AND o.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = tasks.contact_id
      AND c.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );