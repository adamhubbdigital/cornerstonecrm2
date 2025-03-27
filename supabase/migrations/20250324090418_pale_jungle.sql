/*
  # Fix Recent Views RLS Policies

  1. Changes
    - Simplify RLS policies for recent_views table
    - Fix permission issues with inserting and viewing recent views
    - Maintain proper access control while allowing view tracking

  2. Security
    - Keep team-based access control
    - Allow users to track their own views
    - Maintain proper data isolation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own recent views" ON recent_views;
DROP POLICY IF EXISTS "Users can insert their own recent views" ON recent_views;

-- Create simplified policies
CREATE POLICY "Users can view their own recent views"
  ON recent_views
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own recent views"
  ON recent_views
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add UPDATE policy to handle upserts
CREATE POLICY "Users can update their own recent views"
  ON recent_views
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());