/*
  # Fix organisation updates foreign key and policies

  1. Changes
    - Update foreign key constraint to reference profiles table
    - Ensure proper team-based access control
    - Add delete policy for organisation updates

  2. Security
    - Maintain team-based access control
    - Allow users to manage their own updates
*/

-- Drop existing foreign key if it exists
ALTER TABLE organisation_updates
DROP CONSTRAINT IF EXISTS organisation_updates_created_by_fkey;

-- Add proper foreign key constraint to reference profiles
ALTER TABLE organisation_updates
ADD CONSTRAINT organisation_updates_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id);

-- Update organisation_updates policies
DROP POLICY IF EXISTS "Users can view all organisation updates" ON organisation_updates;
DROP POLICY IF EXISTS "Users can insert organisation updates" ON organisation_updates;

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

-- Add delete policy
CREATE POLICY "Users can delete their own organisation updates"
  ON organisation_updates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());