/*
  # Remove unnecessary tables and their dependencies

  1. Changes
    - Remove task_links table
    - Remove recent_views table and its trigger
    - Remove associated triggers and functions
    - Clean up in correct dependency order

  2. Security
    - Maintain existing security model for remaining tables
    - Ensure clean removal of dependencies
*/

-- First remove all triggers
DROP TRIGGER IF EXISTS cleanup_organisation_recent_views ON organisations;
DROP TRIGGER IF EXISTS cleanup_contact_recent_views ON contacts;
DROP TRIGGER IF EXISTS check_recent_view_reference_trigger ON recent_views;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS cleanup_orphaned_recent_views();
DROP FUNCTION IF EXISTS check_recent_view_reference();

-- Drop tables
DROP TABLE IF EXISTS task_links;
DROP TABLE IF EXISTS recent_views;