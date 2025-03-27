/*
  # Add organisation and contact relations to calendar events

  1. Changes
    - Add organisation_id column referencing organisations table
    - Add contact_id column referencing contacts table
    - Update RLS policies to handle new relations

  2. Security
    - Maintain team-based access control
    - Allow proper relationship querying
*/

-- Add organisation_id and contact_id columns
ALTER TABLE calendar_events
ADD COLUMN organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
ADD COLUMN contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

-- Update RLS policies to handle new relations
DROP POLICY IF EXISTS "Team members can view calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Team members can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Team members can update calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Team members can delete calendar events" ON calendar_events;

-- Create updated policies
CREATE POLICY "Team members can view calendar events"
  ON calendar_events
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
    ) OR
    contact_id IN (
      SELECT id FROM contacts
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team members can create calendar events"
  ON calendar_events
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
    ) AND
    (
      contact_id IS NULL OR
      contact_id IN (
        SELECT id FROM contacts
        WHERE team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Team members can update calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );