/*
  # Create organisations table

  1. New Tables
    - `organisations`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `website` (text)
      - `current_status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references users)

  2. Security
    - Enable RLS on organisations table
    - Add policies for authenticated users
*/

-- Create organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  website text,
  current_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all organisations"
  ON organisations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert organisations"
  ON organisations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update organisations"
  ON organisations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE
  ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();