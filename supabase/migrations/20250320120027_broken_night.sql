/*
  # Update relationships and policies for Organizations, Contacts, and Tasks

  1. Changes
    - Add foreign key constraint for contacts.organisation_id
    - Update policies to ensure proper access control
    - Maintain team-based access while allowing linked data visibility

  2. Security
    - Keep team-based access control
    - Allow viewing linked data across tables
    - Maintain proper data isolation between teams
*/

-- Add foreign key constraint for contacts.organisation_id if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contacts_organisation_id_fkey'
  ) THEN
    ALTER TABLE contacts
    ADD CONSTRAINT contacts_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id)
    ON DELETE SET NULL;
  END IF;
END $$;

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
    ) OR
    organisation_id IN (
      SELECT id FROM organisations
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert team contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ) AND
    (
      organisation_id IS NULL OR
      organisation_id IN (
        SELECT id FROM organisations
        WHERE team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
      )
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
      AND (
        c.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
        ) OR
        c.organisation_id IN (
          SELECT id FROM organisations
          WHERE team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          )
        )
      )
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
        SELECT 1 FROM organisations o
        WHERE o.id = organisation_id
        AND o.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
      )
    ) AND
    (
      contact_id IS NULL OR
      EXISTS (
        SELECT 1 FROM contacts c
        WHERE c.id = contact_id
        AND (
          c.team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          ) OR
          c.organisation_id IN (
            SELECT id FROM organisations
            WHERE team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid()
            )
          )
        )
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
      SELECT 1 FROM organisations o
      WHERE o.id = tasks.organisation_id
      AND o.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = tasks.contact_id
      AND (
        c.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
        ) OR
        c.organisation_id IN (
          SELECT id FROM organisations
          WHERE team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          )
        )
      )
    )
  );