/*
  # Create initial team and users

  1. Changes
    - Add unique constraint on teams.name
    - Create a team called "Pregnancy Advice"
    - Create three initial users
    - Add users to the team

  2. Security
    - Users are created in auth.users table
    - Users are linked to the team via team_members table
*/

-- First add unique constraint to teams.name
ALTER TABLE teams ADD CONSTRAINT teams_name_key UNIQUE (name);

DO $$
DECLARE
  v_team_id uuid;
  v_adam_id uuid;
  v_georgina_id uuid;
  v_camilla_id uuid;
BEGIN
  -- Create the team if it doesn't exist
  INSERT INTO teams (name)
  VALUES ('Pregnancy Advice')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_team_id;

  -- If team wasn't created, get its ID
  IF v_team_id IS NULL THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Pregnancy Advice';
  END IF;

  -- Create Adam if not exists
  SELECT id INTO v_adam_id FROM auth.users WHERE email = 'adam@pregnancyadvice.org.uk';
  IF v_adam_id IS NULL THEN
    v_adam_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_adam_id,
      'authenticated',
      'authenticated',
      'adam@pregnancyadvice.org.uk',
      crypt('Password1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Adam Johannes"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Create Georgina if not exists
  SELECT id INTO v_georgina_id FROM auth.users WHERE email = 'georgina@pregnancyadvice.org.uk';
  IF v_georgina_id IS NULL THEN
    v_georgina_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_georgina_id,
      'authenticated',
      'authenticated',
      'georgina@pregnancyadvice.org.uk',
      crypt('Password2345', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Georgina Forbes"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Create Camilla if not exists
  SELECT id INTO v_camilla_id FROM auth.users WHERE email = 'camilla@pregnancyadvice.org.uk';
  IF v_camilla_id IS NULL THEN
    v_camilla_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_camilla_id,
      'authenticated',
      'authenticated',
      'camilla@pregnancyadvice.org.uk',
      crypt('Password3456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Camilla Hunt"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Add users to the team if not already members
  IF v_adam_id IS NOT NULL THEN
    INSERT INTO team_members (team_id, user_id)
    VALUES (v_team_id, v_adam_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_georgina_id IS NOT NULL THEN
    INSERT INTO team_members (team_id, user_id)
    VALUES (v_team_id, v_georgina_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_camilla_id IS NOT NULL THEN
    INSERT INTO team_members (team_id, user_id)
    VALUES (v_team_id, v_camilla_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;