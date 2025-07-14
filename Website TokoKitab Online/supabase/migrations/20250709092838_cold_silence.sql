/*
  # Fix user registration and sync missing profiles

  1. Function Updates
    - Update handle_new_user function to be more robust
    - Add sync function to create missing user profiles
    - Handle duplicate NIM constraints properly

  2. Error Handling
    - Handle unique constraint violations for NIM
    - Provide fallback values for missing data
    - Ensure auth users always have corresponding profiles

  3. Data Sync
    - Sync existing auth users without profiles
    - Handle edge cases and conflicts gracefully
*/

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user data from auth metadata with better error handling
  INSERT INTO public.users (id, email, name, nim, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email_change_token_new, NEW.email, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'nim', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE 
      WHEN EXCLUDED.name != '' THEN EXCLUDED.name 
      ELSE users.name 
    END,
    nim = CASE 
      WHEN EXCLUDED.nim != '' THEN EXCLUDED.nim 
      ELSE users.nim 
    END,
    role = EXCLUDED.role,
    updated_at = now()
  ON CONFLICT (nim) DO UPDATE SET
    id = CASE 
      WHEN users.id != EXCLUDED.id THEN EXCLUDED.id
      ELSE users.id
    END,
    email = EXCLUDED.email,
    name = CASE 
      WHEN EXCLUDED.name != '' THEN EXCLUDED.name 
      ELSE users.name 
    END,
    role = EXCLUDED.role,
    updated_at = now()
  ON CONFLICT (email) DO UPDATE SET
    id = CASE 
      WHEN users.id != EXCLUDED.id THEN EXCLUDED.id
      ELSE users.id
    END,
    name = CASE 
      WHEN EXCLUDED.name != '' THEN EXCLUDED.name 
      ELSE users.name 
    END,
    nim = CASE 
      WHEN EXCLUDED.nim != '' THEN EXCLUDED.nim 
      ELSE users.nim 
    END,
    role = EXCLUDED.role,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add a function to manually sync user profiles if needed
CREATE OR REPLACE FUNCTION sync_missing_user_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user RECORD;
  user_nim text;
  user_name text;
  counter integer := 0;
BEGIN
  -- Find auth users without corresponding profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Extract NIM and name from metadata
    user_nim := COALESCE(auth_user.raw_user_meta_data->>'nim', '');
    user_name := COALESCE(auth_user.raw_user_meta_data->>'name', auth_user.email, 'User');
    
    -- If NIM is empty or already exists, generate a unique one
    IF user_nim = '' OR EXISTS (SELECT 1 FROM public.users WHERE nim = user_nim) THEN
      -- Generate a unique NIM based on email or timestamp
      user_nim := 'AUTO_' || EXTRACT(EPOCH FROM now())::bigint::text || '_' || counter;
      counter := counter + 1;
    END IF;
    
    BEGIN
      -- Create missing profile with unique constraints handling
      INSERT INTO public.users (id, email, name, nim, role)
      VALUES (
        auth_user.id,
        auth_user.email,
        user_name,
        user_nim,
        COALESCE(auth_user.raw_user_meta_data->>'role', 'user')
      );
      
      RAISE NOTICE 'Created missing profile for user: % with NIM: %', auth_user.email, user_nim;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Handle unique constraint violations
        IF SQLERRM LIKE '%nim%' THEN
          -- NIM conflict, try with a different NIM
          user_nim := 'AUTO_' || auth_user.id || '_' || EXTRACT(EPOCH FROM now())::bigint::text;
          
          INSERT INTO public.users (id, email, name, nim, role)
          VALUES (
            auth_user.id,
            auth_user.email,
            user_name,
            user_nim,
            COALESCE(auth_user.raw_user_meta_data->>'role', 'user')
          );
          
          RAISE NOTICE 'Created profile with auto-generated NIM for user: % (NIM: %)', auth_user.email, user_nim;
          
        ELSIF SQLERRM LIKE '%email%' THEN
          -- Email conflict, update existing record with new auth ID
          UPDATE public.users 
          SET id = auth_user.id, updated_at = now()
          WHERE email = auth_user.email;
          
          RAISE NOTICE 'Updated existing profile with new auth ID for user: %', auth_user.email;
          
        ELSE
          -- Other unique constraint violation
          RAISE WARNING 'Could not create profile for user %: %', auth_user.email, SQLERRM;
        END IF;
        
      WHEN OTHERS THEN
        RAISE WARNING 'Unexpected error creating profile for user %: %', auth_user.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'User profile sync completed';
END;
$$;

-- Run the sync function to fix any existing issues
SELECT sync_missing_user_profiles();

-- Clean up: remove the sync function after use (optional)
-- DROP FUNCTION IF EXISTS sync_missing_user_profiles();