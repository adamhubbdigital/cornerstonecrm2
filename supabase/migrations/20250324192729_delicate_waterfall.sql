/*
  # Add delete policy for contact updates

  1. Changes
    - Add delete policy for contact updates
    - Ensure users can only delete updates they created

  2. Security
    - Maintain team-based access control
    - Only allow users to delete their own updates
*/

-- Add delete policy for contact updates
CREATE POLICY "Users can delete their own contact updates"
  ON contact_updates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());