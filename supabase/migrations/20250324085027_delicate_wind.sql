/*
  # Add unique constraint to recent_views table

  1. Changes
    - Add unique constraint for user_id, item_type, and item_id columns
    - This enables the ON CONFLICT clause to work properly

  2. Security
    - Maintains existing security model
    - Ensures data integrity
*/

-- Add unique constraint to recent_views table
ALTER TABLE recent_views
ADD CONSTRAINT recent_views_user_item_unique
UNIQUE (user_id, item_type, item_id);