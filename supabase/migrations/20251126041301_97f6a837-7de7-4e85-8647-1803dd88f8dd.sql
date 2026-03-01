-- Drop all policies that depend on app_role
DROP POLICY IF EXISTS "Contractors can create bids" ON contractor_bids;
DROP POLICY IF EXISTS "Contractors can view their own bids" ON contractor_bids;
DROP POLICY IF EXISTS "Contractors can update their own bids" ON contractor_bids;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Officers and admins can delete reports" ON reports;
DROP POLICY IF EXISTS "Officers and admins can manage recommendations" ON ai_recommendations;
DROP POLICY IF EXISTS "Officers and admins can manage zones" ON zones;
DROP POLICY IF EXISTS "Officers and admins can update any report" ON reports;

-- Drop the has_role function
DROP FUNCTION IF EXISTS has_role(uuid, app_role);

-- Now we can safely alter the enum
ALTER TYPE app_role RENAME TO app_role_old;

CREATE TYPE app_role AS ENUM ('citizen', 'official');

-- Update the user_roles table to use the new enum
ALTER TABLE user_roles 
  ALTER COLUMN role TYPE app_role USING 
    CASE 
      WHEN role::text IN ('municipal_officer', 'admin', 'contractor') THEN 'official'::app_role
      ELSE 'citizen'::app_role
    END;

-- Drop the old enum
DROP TYPE app_role_old CASCADE;

-- Recreate the has_role function with new enum
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default role
ALTER TABLE user_roles 
  ALTER COLUMN role SET DEFAULT 'citizen'::app_role;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert with the role passed in metadata, or default to citizen
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'citizen'::app_role)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recreate simplified RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow officials to manage data
DROP POLICY IF EXISTS "Officials can manage reports" ON reports;
CREATE POLICY "Officials can manage reports"
  ON reports FOR ALL
  USING (has_role(auth.uid(), 'official'::app_role));

DROP POLICY IF EXISTS "Officials can manage zones" ON zones;
CREATE POLICY "Officials can manage zones"
  ON zones FOR ALL
  USING (has_role(auth.uid(), 'official'::app_role));

DROP POLICY IF EXISTS "Officials can manage recommendations" ON ai_recommendations;
CREATE POLICY "Officials can manage recommendations"
  ON ai_recommendations FOR ALL
  USING (has_role(auth.uid(), 'official'::app_role));