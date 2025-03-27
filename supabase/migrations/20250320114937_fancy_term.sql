/*
  # Fix team-based access policies

  1. Changes
    - Update organizations policy to use direct team membership check
    - Update contacts policy to use direct team membership check
    - Ensure consistent policy naming and logic

  2. Security
    - Maintain team-based access control
    - Prevent infinite recursion
    - Keep existing security model intact
*/

-- Update organizations policies
DROP POLICY IF EXISTS "Team members can view organisations" ON organisations;
DROP POLICY IF EXISTS "Team members can insert organisations" ON organisations;
DROP POLICY IF EXISTS "Team members can update organisations" ON organisations;

CREATE POLICY "Users can view team organisations"
  ON organisations
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team organisations"
  ON organisations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team organisations"
  ON organisations
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update contacts policies
DROP POLICY IF EXISTS "Team members can view contacts" ON contacts;
DROP POLICY IF EXISTS "Team members can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Team members can update contacts" ON contacts;

CREATE POLICY "Users can view team contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );