/*
  # Add recent_views table

  1. New Tables
    - `recent_views`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `item_type` (text, enum: organisation, contact)
      - `item_id` (uuid)
      - `viewed_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create recent_views table
CREATE TABLE IF NOT EXISTS recent_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  CONSTRAINT recent_views_item_type_check CHECK (item_type IN ('organisation', 'contact')),
  CONSTRAINT recent_views_user_item_unique UNIQUE (user_id, item_type, item_id)
);

-- Enable RLS
ALTER TABLE recent_views ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can update their own recent views"
  ON recent_views
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to validate references
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
CREATE TRIGGER check_recent_view_reference_trigger
  BEFORE INSERT OR UPDATE ON recent_views
  FOR EACH ROW
  EXECUTE FUNCTION check_recent_view_reference();

-- Create function to clean up orphaned recent views
CREATE OR REPLACE FUNCTION cleanup_orphaned_recent_views()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM recent_views
  WHERE item_type = TG_ARGV[0]
  AND item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to clean up orphaned recent views
CREATE TRIGGER cleanup_organisation_recent_views
  BEFORE DELETE ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_recent_views('organisation');

CREATE TRIGGER cleanup_contact_recent_views
  BEFORE DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_recent_views('contact');