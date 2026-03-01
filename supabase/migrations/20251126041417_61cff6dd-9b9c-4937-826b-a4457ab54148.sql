-- Fix function search paths
ALTER FUNCTION has_role(_user_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;

-- Enable RLS on contractor_bids table and add policies
ALTER TABLE contractor_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Officials can view all bids" ON contractor_bids;
CREATE POLICY "Officials can view all bids"
  ON contractor_bids FOR SELECT
  USING (has_role(auth.uid(), 'official'::app_role));

DROP POLICY IF EXISTS "Officials can create bids" ON contractor_bids;
CREATE POLICY "Officials can create bids"
  ON contractor_bids FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'official'::app_role));

DROP POLICY IF EXISTS "Officials can update bids" ON contractor_bids;
CREATE POLICY "Officials can update bids"
  ON contractor_bids FOR UPDATE
  USING (has_role(auth.uid(), 'official'::app_role));

-- Ensure profiles has proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Ensure notifications has proper policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);