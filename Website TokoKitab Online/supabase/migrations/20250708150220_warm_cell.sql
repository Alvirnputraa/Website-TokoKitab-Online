/*
  # Fix admin role detection and RLS policies

  1. Policy Fixes
    - Fix infinite recursion in admin policy
    - Simplify role-based access control
    - Add proper policy for profile fetching

  2. Role Detection
    - Ensure role is read from database, not metadata
    - Fix policy conflicts
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data during registration" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert user data" ON users;

-- Create new, simplified policies without recursion
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a separate policy for admin access using a function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Admin policy using the function (avoids recursion)
CREATE POLICY "Admins can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    is_admin(auth.uid())
  );

-- Allow service role to insert (for triggers)
CREATE POLICY "Service role can insert"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert during registration
CREATE POLICY "Allow registration inserts"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);