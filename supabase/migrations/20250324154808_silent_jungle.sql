/*
  # Add organisation updates table

  1. New Tables
    - `organisation_updates`
      - `id` (uuid, primary key)
      - `organisation_id` (uuid, references organisations)
      - `type` (text, enum: meeting, event, status, other)
      - `content` (text, required)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create organisation_updates table
CREATE TABLE IF NOT EXISTS organisation_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  CONSTRAINT organisation_updates_type_check CHECK (
    type IN ('meeting', 'event', 'status', 'other')
  )
);

-- Enable RLS
ALTER TABLE organisation_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all organisation updates"
  ON organisation_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE o.id = organisation_updates.organisation_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organisation updates"
  ON organisation_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisations o
      INNER JOIN team_members tm ON tm.team_id = o.team_id
      WHERE o.id = organisation_updates.organisation_id
      AND tm.user_id = auth.uid()
    )
  );

-- Create trigger to clean up updates when organisation is deleted
CREATE OR REPLACE FUNCTION handle_cascade_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- When an organisation is deleted, updates are handled by ON DELETE CASCADE
  IF TG_TABLE_NAME = 'organisations' THEN
    -- Update contacts and tasks (existing functionality)
    UPDATE contacts SET organisation_id = NULL WHERE organisation_id = OLD.id;
    UPDATE tasks SET organisation_id = NULL WHERE organisation_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;