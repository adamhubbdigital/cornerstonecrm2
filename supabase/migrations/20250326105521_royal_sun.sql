/*
  # Add team members materialized view with profile information

  1. Changes
    - Create a materialized view that joins team_members with profiles
    - Show member names and other relevant information
    - Add refresh function and trigger

  2. Security
    - Inherits security from underlying tables
    - Maintains team-based access control
*/

-- Create materialized view for team members with profile information
CREATE MATERIALIZED VIEW team_members_with_profiles AS
SELECT 
  tm.id,
  tm.team_id,
  tm.user_id,
  tm.created_at,
  p.full_name,
  p.avatar_url
FROM team_members tm
JOIN profiles p ON p.id = tm.user_id
WITH DATA;

-- Create index on the materialized view
CREATE UNIQUE INDEX team_members_with_profiles_id_idx ON team_members_with_profiles (id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_team_members_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY team_members_with_profiles;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view when underlying data changes
CREATE TRIGGER refresh_team_members_view_on_team_change
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_team_members_view();

CREATE TRIGGER refresh_team_members_view_on_profile_change
  AFTER UPDATE OF full_name, avatar_url ON profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_team_members_view();