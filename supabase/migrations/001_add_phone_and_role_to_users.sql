
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'owner';

ALTER TABLE public.users 
ADD CONSTRAINT IF NOT EXISTS users_role_check 
CHECK (role IN ('admin', 'manager', 'owner'));

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
