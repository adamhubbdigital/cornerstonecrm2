/*
  # Fix Deletion Cascade and Constraints

  1. Changes
    - Add proper ON DELETE CASCADE constraints
    - Update foreign key relationships
    - Ensure proper cleanup of related records

  2. Security
    - Maintain data integrity
    - Prevent orphaned records
*/

-- Update task_links foreign key to cascade delete
ALTER TABLE task_links
DROP CONSTRAINT IF EXISTS task_links_task_id_fkey,
ADD CONSTRAINT task_links_task_id_fkey
  FOREIGN KEY (task_id)
  REFERENCES tasks(id)
  ON DELETE CASCADE;

-- Update tasks foreign keys to set null on delete
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_organisation_id_fkey,
ADD CONSTRAINT tasks_organisation_id_fkey
  FOREIGN KEY (organisation_id)
  REFERENCES organisations(id)
  ON DELETE SET NULL;

ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_contact_id_fkey,
ADD CONSTRAINT tasks_contact_id_fkey
  FOREIGN KEY (contact_id)
  REFERENCES contacts(id)
  ON DELETE SET NULL;

-- Update contacts foreign key to set null on delete
ALTER TABLE contacts
DROP CONSTRAINT IF EXISTS contacts_organisation_id_fkey,
ADD CONSTRAINT contacts_organisation_id_fkey
  FOREIGN KEY (organisation_id)
  REFERENCES organisations(id)
  ON DELETE SET NULL;

-- Create function to handle cascading updates
CREATE OR REPLACE FUNCTION handle_cascade_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- When an organisation is deleted, update related contacts and tasks
  IF TG_TABLE_NAME = 'organisations' THEN
    UPDATE contacts SET organisation_id = NULL WHERE organisation_id = OLD.id;
    UPDATE tasks SET organisation_id = NULL WHERE organisation_id = OLD.id;
  END IF;

  -- When a contact is deleted, update related tasks
  IF TG_TABLE_NAME = 'contacts' THEN
    UPDATE tasks SET contact_id = NULL WHERE contact_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cascade updates
DROP TRIGGER IF EXISTS organisation_cascade_updates ON organisations;
CREATE TRIGGER organisation_cascade_updates
  BEFORE DELETE ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION handle_cascade_updates();

DROP TRIGGER IF EXISTS contact_cascade_updates ON contacts;
CREATE TRIGGER contact_cascade_updates
  BEFORE DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION handle_cascade_updates();