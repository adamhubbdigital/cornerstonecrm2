/*
  # Team Management and Security Updates

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `created_at` (timestamp)

    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Update RLS policies for organisations and contacts to be team-based
    - Add policies for team members to view team data

  3. Changes
    - Add team_id to organisations and contacts tables
    - Update existing RLS policies
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Add team_id to organisations
ALTER TABLE organisations 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id);

-- Add team_id to contacts
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
CREATE POLICY "Team members can view their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Create policies for team_members
CREATE POLICY "Team members can view their team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Update organisations policies
DROP POLICY IF EXISTS "Users can view all organisations" ON organisations;
DROP POLICY IF EXISTS "Users can insert organisations" ON organisations;
DROP POLICY IF EXISTS "Users can update organisations" ON organisations;

CREATE POLICY "Team members can view organisations"
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

CREATE POLICY "Team members can insert organisations"
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

CREATE POLICY "Team members can update organisations"
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

-- Update contacts policies
DROP POLICY IF EXISTS "Users can view all contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON contacts;

CREATE POLICY "Team members can view contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = contacts.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = contacts.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update contacts"
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

-- Update tasks policies to be user-specific
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
CREATE POLICY "Users can view own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);