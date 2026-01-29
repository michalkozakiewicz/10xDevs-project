-- Development User Setup
-- This file creates a development user for testing purposes
-- NOT A MIGRATION - Run manually in Supabase SQL Editor during development

-- Insert development user into auth.users table
-- This bypasses normal authentication for development purposes
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'dev@example.com',
  crypt('dev-password-123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Development User"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT
  id,
  email,
  role,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000001';
