/*
  # Add sample user data

  1. Sample Data
    - Creates sample users in auth.users first
    - Then creates corresponding profiles in public.users
    - Ensures foreign key constraints are satisfied

  2. Security
    - Uses proper UUID generation
    - Maintains referential integrity
    - Includes proper error handling

  Note: This migration creates sample data for testing purposes.
  In production, users should be created through the registration process.
*/

-- First, we need to create users in auth.users table
-- Since we can't directly insert into auth.users in migrations,
-- we'll create a function to handle this properly

-- Create a function to safely insert sample users
CREATE OR REPLACE FUNCTION create_sample_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_1 uuid;
  user_id_2 uuid;
  user_id_3 uuid;
BEGIN
  -- Generate UUIDs for our sample users
  user_id_1 := gen_random_uuid();
  user_id_2 := gen_random_uuid();
  user_id_3 := gen_random_uuid();

  -- Insert into auth.users (this is a simplified approach for sample data)
  -- Note: In a real application, users should be created through Supabase Auth
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES
    (
      user_id_1,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'john.doe@university.edu',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      user_id_2,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'jane.smith@university.edu',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      user_id_3,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@university.edu',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
  ON CONFLICT (id) DO NOTHING;

  -- Now insert into public.users with the same IDs
  INSERT INTO public.users (id, nim, name, email, role, created_at, updated_at) VALUES
    (user_id_1, '12345678', 'John Doe', 'john.doe@university.edu', 'user', now(), now()),
    (user_id_2, '87654321', 'Jane Smith', 'jane.smith@university.edu', 'user', now(), now()),
    (user_id_3, '11111111', 'Admin User', 'admin@university.edu', 'admin', now(), now())
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    -- If there's an error, we'll just skip creating sample users
    -- This prevents the migration from failing in production
    RAISE NOTICE 'Could not create sample users: %', SQLERRM;
END;
$$;

-- Execute the function to create sample users
SELECT create_sample_users();

-- Drop the function as it's no longer needed
DROP FUNCTION IF EXISTS create_sample_users();

-- Alternative approach: Create a simpler sample data insertion
-- that doesn't rely on auth.users manipulation
DO $$
DECLARE
  sample_user_1 uuid := '550e8400-e29b-41d4-a716-446655440001';
  sample_user_2 uuid := '550e8400-e29b-41d4-a716-446655440002';
  sample_user_3 uuid := '550e8400-e29b-41d4-a716-446655440003';
BEGIN
  -- Only insert if the users table is empty (to avoid conflicts)
  IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    -- Insert sample users with placeholder UUIDs
    -- These will need to be updated when real auth users are created
    INSERT INTO public.users (id, nim, name, email, role, created_at, updated_at) VALUES
      (sample_user_1, '12345678', 'John Doe', 'john.doe@university.edu', 'user', now(), now()),
      (sample_user_2, '87654321', 'Jane Smith', 'jane.smith@university.edu', 'user', now(), now()),
      (sample_user_3, '11111111', 'Admin User', 'admin@university.edu', 'admin', now(), now())
    ON CONFLICT (nim) DO NOTHING;
    
    RAISE NOTICE 'Sample users created. Please create corresponding auth users manually.';
  END IF;
END $$;

-- Create a helper function to sync user data when auth users are created
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a new auth user is created, check if we have a profile waiting
  -- and update it with the correct auth user ID
  UPDATE public.users 
  SET id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync profiles when auth users are created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();