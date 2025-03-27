/*
  # Fix contact updates and profiles relationship

  1. Changes
    - Drop existing foreign key constraint
    - Add proper foreign key constraint to auth.users
    - Update RLS policies
    - Ensure proper relationship for creator lookup

  2. Security
    - Maintain team-based access control
    - Keep proper authorization checks
*/

-- Drop existing foreign key if it exists
ALTER TABLE contact_updates
DROP CONSTRAINT IF EXISTS contact_updates_created_by_fkey;

-- Add proper foreign key constraint
ALTER TABLE contact_updates
ADD CONSTRAINT contact_updates_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Update contact_updates policies
DROP POLICY IF EXISTS "Users can view all contact updates" ON contact_updates;
DROP POLICY IF EXISTS "Users can insert contact updates" ON contact_updates;

CREATE POLICY "Users can view all contact updates"
  ON contact_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE c.id = contact_updates.contact_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contact updates"
  ON contact_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts c
      INNER JOIN team_members tm ON tm.team_id = c.team_id
      WHERE c.id = contact_updates.contact_id
      AND tm.user_id = auth.uid()
    )
  );

-- Ensure profiles policy exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;