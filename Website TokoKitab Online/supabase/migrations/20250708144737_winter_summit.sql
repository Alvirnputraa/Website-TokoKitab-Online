/*
  # Add INSERT policy for user registration

  1. Security Changes
    - Add policy to allow INSERT for new user registration
    - Allow users to insert their own data during registration
    - Ensure the trigger function works properly

  2. Policy Details
    - Users can insert data if the ID matches their auth.uid()
    - This allows the registration process to work correctly
*/

-- Add policy for users to insert their own data during registration
CREATE POLICY "Users can insert own data during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also add a policy for the trigger function to work
-- This allows the trigger to insert data when a new auth user is created
CREATE POLICY "Allow trigger to insert user data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user data from auth metadata
  INSERT INTO public.users (id, email, name, nim, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'nim', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    nim = EXCLUDED.nim,
    role = EXCLUDED.role,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();