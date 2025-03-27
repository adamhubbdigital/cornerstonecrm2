/*
  # Create tasks and task links tables

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

-- Create tasks table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    due_date timestamptz,
    status text NOT NULL DEFAULT 'pending',
    organisation_id uuid REFERENCES organisations(id),
    contact_id uuid REFERENCES contacts(id),
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT tasks_status_check CHECK (
      status IN ('pending', 'in_progress', 'completed')
    )
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Create task_links table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS task_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    url text NOT NULL,
    title text,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view all tasks'
  ) THEN
    CREATE POLICY "Users can view all tasks"
      ON tasks
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can insert tasks'
  ) THEN
    CREATE POLICY "Users can insert tasks"
      ON tasks
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update tasks'
  ) THEN
    CREATE POLICY "Users can update tasks"
      ON tasks
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- Create policies for task_links
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_links' AND policyname = 'Users can view all task links'
  ) THEN
    CREATE POLICY "Users can view all task links"
      ON task_links
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_links' AND policyname = 'Users can insert task links'
  ) THEN
    CREATE POLICY "Users can insert task links"
      ON task_links
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = (
          SELECT created_by FROM tasks WHERE id = task_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_links' AND policyname = 'Users can delete task links'
  ) THEN
    CREATE POLICY "Users can delete task links"
      ON task_links
      FOR DELETE
      TO authenticated
      USING (
        auth.uid() = (
          SELECT created_by FROM tasks WHERE id = task_id
        )
      );
  END IF;
END $$;

-- Create trigger for tasks updated_at if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE
      ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;