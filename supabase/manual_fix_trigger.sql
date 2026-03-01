
-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- Run this in your Supabase SQL Editor if data is not being saved automatically.

-- 1. Create the function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'citizen'));
  
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
