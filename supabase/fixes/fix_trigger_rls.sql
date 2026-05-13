-- Fix: Make the handle_new_user trigger resilient to RLS policy conflicts.
-- Paste this into the Supabase SQL Editor and click "Run".
-- ---------------------------------------------------------------

-- Drop + recreate the trigger function with:
--   1. EXCEPTION handler so a profile-insert failure doesn't break user creation
--   2. SET search_path for security best practice

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log and continue — never block user creation due to profile failure
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also widen the profiles INSERT policy so the trigger (postgres role) can always insert
DROP POLICY IF EXISTS "profiles_insert_service" ON profiles;

CREATE POLICY "profiles_insert_any"
  ON profiles FOR INSERT
  WITH CHECK (TRUE);
