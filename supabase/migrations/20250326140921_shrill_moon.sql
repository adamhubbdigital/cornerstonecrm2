/*
  # Add calendar events table

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `start_time` (timestamptz, required)
      - `end_time` (timestamptz, required)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `task_id` (uuid, references tasks)
      - `team_id` (uuid, references teams)

  2. Security
    - Enable RLS
    - Add policies for team members
*/

CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) NOT NULL,
  CONSTRAINT events_time_check CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
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

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();