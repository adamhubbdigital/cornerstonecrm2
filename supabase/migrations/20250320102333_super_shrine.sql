/*
  # Create contacts and contact updates tables

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text)
      - `phone` (text)
      - `role` (text)
      - `organisation_id` (uuid, references organisations)
      - `current_status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references users)

    - `contact_updates`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `type` (text, enum: email, phone, meeting, event, other)
      - `content` (text, required)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  role text,
  organisation_id uuid REFERENCES organisations(id),
  current_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Create contact_updates table
CREATE TABLE IF NOT EXISTS contact_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  CONSTRAINT contact_updates_type_check CHECK (
    type IN ('email', 'phone', 'meeting', 'event', 'other')
  )
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can view all contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for contact_updates
CREATE POLICY "Users can view all contact updates"
  ON contact_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert contact updates"
  ON contact_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create trigger for contacts updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE
  ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();