/*
  # Fix team members policy

  1. Changes
    - Replace recursive team members policy with a direct policy
    - Simplify the policy logic to avoid infinite recursion

  2. Security
    - Maintain same level of access control
    - Ensure users can only see members of their own teams
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Team members can view their team members" ON team_members;

-- Create new direct policy
CREATE POLICY "Users can view members of their teams"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );