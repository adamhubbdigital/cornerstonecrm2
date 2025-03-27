/*
  # Update Task Policies for Team Visibility

  1. Changes
    - Update task policies to allow team members to view all tasks
    - Allow team members to update tasks they're assigned to
    - Ensure task creators can always manage their tasks
    - Add policy for task assignment within teams

  2. Security
    - Maintain team-based access control
    - Allow task visibility across team members
    - Preserve data isolation between teams
*/

-- Drop existing task policies
DROP POLICY IF EXISTS "Users can view team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert team tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update team tasks" ON tasks;

-- Create new policies for team-wide task visibility
CREATE POLICY "Team members can view all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      WHERE tm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM team_members tm2
        WHERE tm2.team_id = tm1.team_id
        AND tm2.user_id = tasks.created_by
      )
    )
  );

CREATE POLICY "Team members can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm1
      WHERE tm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM team_members tm2
        WHERE tm2.team_id = tm1.team_id
        AND tm2.user_id = tasks.assignee_id
      )
    )
  );

CREATE POLICY "Team members can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm1
      WHERE tm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM team_members tm2
        WHERE tm2.team_id = tm1.team_id
        AND (
          tm2.user_id = tasks.created_by OR
          tm2.user_id = tasks.assignee_id
        )
      )
    )
  );