/*
  # Fix infinite recursion in database policies

  1. Changes
    - Simplify team member policies to avoid recursion
    - Update task policies to use direct joins
    - Optimize contact and organisation policies
    - Ensure proper relationship handling between entities

  2. Security
    - Maintain team-based access control
    - Preserve data isolation between teams
    - Keep proper authorization checks
*/

-- Update team_members policy to be simpler and non-recursive
DROP POLICY IF EXISTS "Users can view team members" ON team_members;

CREATE POLICY "Users can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update organizations policies to use direct team membership
DROP POLICY IF EXISTS "Users can view team organisations" ON organisations;
DROP POLICY IF EXISTS "Users can insert team organisations" ON organisations;
DROP POLICY IF EXISTS "Users can update team organisations" ON organisations;

CREATE POLICY "Users can view team organisations"
  ON organisations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = organisations.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team organisations"
  ON organisations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = organisations.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team organisations"
  ON organisations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = organisations.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Update contacts policies to handle both direct team membership and organisation relationships
DROP POLICY IF EXISTS "Users can view team contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert team contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update team contacts" ON contacts;

CREATE POLICY "Users can view team contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = contacts.team_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM organisations
      INNER JOIN team_members ON team_members.team_id = organisations.team_id
      WHERE organisations.id = contacts.organisation_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = contacts.team_id
      AND team_members.user_id = auth.uid()
    ) AND
    (
      organisation_id IS NULL OR
      EXISTS (
        SELECT 1 FROM organisations
        INNER JOIN team_members ON team_members.team_id = organisations.team_id
        WHERE organisations.id = contacts.organisation_id
        AND team_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update team contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = contacts.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Update tasks policies to use direct joins and avoid recursion
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
      SELECT 1 FROM organisations
      INNER JOIN team_members ON team_members.team_id = organisations.team_id
      WHERE organisations.id = tasks.organisation_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM contacts
      LEFT JOIN organisations ON organisations.id = contacts.organisation_id
      INNER JOIN team_members ON (
        team_members.team_id = contacts.team_id OR
        team_members.team_id = organisations.team_id
      )
      WHERE contacts.id = tasks.contact_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      organisation_id IS NULL OR
      EXISTS (
        SELECT 1 FROM organisations
        INNER JOIN team_members ON team_members.team_id = organisations.team_id
        WHERE organisations.id = organisation_id
        AND team_members.user_id = auth.uid()
      )
    ) AND
    (
      contact_id IS NULL OR
      EXISTS (
        SELECT 1 FROM contacts
        LEFT JOIN organisations ON organisations.id = contacts.organisation_id
        INNER JOIN team_members ON (
          team_members.team_id = contacts.team_id OR
          team_members.team_id = organisations.team_id
        )
        WHERE contacts.id = contact_id
        AND team_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update team tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisations
      INNER JOIN team_members ON team_members.team_id = organisations.team_id
      WHERE organisations.id = tasks.organisation_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM contacts
      LEFT JOIN organisations ON organisations.id = contacts.organisation_id
      INNER JOIN team_members ON (
        team_members.team_id = contacts.team_id OR
        team_members.team_id = organisations.team_id
      )
      WHERE contacts.id = tasks.contact_id
      AND team_members.user_id = auth.uid()
    )
  );