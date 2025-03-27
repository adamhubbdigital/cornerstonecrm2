/*
  # Fix recent views table relationships

  1. Changes
    - Drop existing foreign key constraints
    - Add check constraint for item_type
    - Add trigger function to validate references
    - Update RLS policies
    - Add cleanup triggers for orphaned records

  2. Security
    - Maintain team-based access control
    - Ensure proper data validation
    - Keep referential integrity
*/

-- Drop existing foreign key constraints if they exist
DO $$ BEGIN
  ALTER TABLE recent_views DROP CONSTRAINT IF EXISTS recent_views_item_id_fkey;
  ALTER TABLE recent_views DROP CONSTRAINT IF EXISTS recent_views_organisation_id_fkey;
  ALTER TABLE recent_views DROP CONSTRAINT IF EXISTS recent_views_contact_id_fkey;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add check constraint for item_type
DO $$ BEGIN
  ALTER TABLE recent_views DROP CONSTRAINT IF EXISTS recent_views_item_type_check;
  ALTER TABLE recent_views ADD CONSTRAINT recent_views_item_type_check
    CHECK (item_type IN ('organisation', 'contact'));
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create trigger function to validate references
CREATE OR REPLACE FUNCTION check_recent_view_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type = 'organisation' THEN
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = NEW.item_id) THEN
      RAISE EXCEPTION 'Referenced organisation does not exist';
    END IF;
  ELSIF NEW.item_type = 'contact' THEN
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = NEW.item_id) THEN
      RAISE EXCEPTION 'Referenced contact does not exist';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce referential integrity
DROP TRIGGER IF EXISTS check_recent_view_reference_trigger ON recent_views;
CREATE TRIGGER check_recent_view_reference_trigger
  BEFORE INSERT OR UPDATE ON recent_views
  FOR EACH ROW
  EXECUTE FUNCTION check_recent_view_reference();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own recent views" ON recent_views;
DROP POLICY IF EXISTS "Users can insert their own recent views" ON recent_views;

CREATE POLICY "Users can view their own recent views"
  ON recent_views
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    CASE 
      WHEN item_type = 'organisation' THEN
        EXISTS (
          SELECT 1 FROM organisations o
          WHERE o.id = item_id
          AND o.team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          )
        )
      WHEN item_type = 'contact' THEN
        EXISTS (
          SELECT 1 FROM contacts c
          WHERE c.id = item_id
          AND (
            c.team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid()
            )
            OR c.organisation_id IN (
              SELECT o.id FROM organisations o
              WHERE o.team_id IN (
                SELECT team_id FROM team_members WHERE user_id = auth.uid()
              )
            )
          )
        )
      ELSE false
    END
  );

CREATE POLICY "Users can insert their own recent views"
  ON recent_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    CASE 
      WHEN item_type = 'organisation' THEN
        EXISTS (
          SELECT 1 FROM organisations o
          WHERE o.id = item_id
          AND o.team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          )
        )
      WHEN item_type = 'contact' THEN
        EXISTS (
          SELECT 1 FROM contacts c
          WHERE c.id = item_id
          AND (
            c.team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid()
            )
            OR c.organisation_id IN (
              SELECT o.id FROM organisations o
              WHERE o.team_id IN (
                SELECT team_id FROM team_members WHERE user_id = auth.uid()
              )
            )
          )
        )
      ELSE false
    END
  );

-- Create function to clean up orphaned recent views
CREATE OR REPLACE FUNCTION cleanup_orphaned_recent_views()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM recent_views
  WHERE item_type = TG_ARGV[0]::text
  AND item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to clean up orphaned recent views
DROP TRIGGER IF EXISTS cleanup_organisation_recent_views ON organisations;
CREATE TRIGGER cleanup_organisation_recent_views
  BEFORE DELETE ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_recent_views();

DROP TRIGGER IF EXISTS cleanup_contact_recent_views ON contacts;
CREATE TRIGGER cleanup_contact_recent_views
  BEFORE DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_recent_views();