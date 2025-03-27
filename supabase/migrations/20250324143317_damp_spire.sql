/*
  # Fix Task and User Relationships

  1. Changes
    - Add foreign key constraint for tasks.assignee_id
    - Add foreign key constraint for team_members.user_id
    - Update queries to use correct relationship names

  2. Security
    - Maintain existing security model
    - Keep proper authorization checks
*/

-- Drop existing foreign key if it exists
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;

-- Add proper foreign key constraint for tasks.assignee_id
ALTER TABLE tasks
ADD CONSTRAINT tasks_assignee_id_fkey
FOREIGN KEY (assignee_id) REFERENCES auth.users(id);

-- Drop existing foreign key if it exists
ALTER TABLE team_members
DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

-- Add proper foreign key constraint for team_members.user_id
ALTER TABLE team_members
ADD CONSTRAINT team_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);