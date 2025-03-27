/*
  # Create tasks and task links tables with proper relationships

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `due_date` (timestamp)
      - `status` (text, enum: pending, in_progress, completed)
      - `organisation_id` (uuid, references organisations)
      - `contact_id` (uuid, references contacts)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `task_links`
      - `id` (uuid, primary key)
      - `task_id` (uuid, references tasks)
      - `url` (text, required)
      - `title` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS task_links;
DROP TABLE IF EXISTS tasks;

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  organisation_id uuid,
  contact_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT tasks_status_check CHECK (
    status IN ('pending', 'in_progress', 'completed')
  ),
  CONSTRAINT tasks_organisation_id_fkey FOREIGN KEY (organisation_id)
    REFERENCES organisations(id) ON DELETE SET NULL,
  CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE SET NULL,
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
);

-- Create task_links table
CREATE TABLE task_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  url text NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT task_links_task_id_fkey FOREIGN KEY (task_id)
    REFERENCES tasks(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for task_links
CREATE POLICY "Users can view all task links"
  ON task_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert task links"
  ON task_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT created_by FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Users can delete task links"
  ON task_links
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT created_by FROM tasks WHERE id = task_id
    )
  );

-- Create trigger for tasks updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();