-- SkillSwap Database Schema Migration V6
-- Public Profile Sharing with Unique Non-Sensitive Identifier and Privacy Toggle

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS public_profile_id VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS public_profile_enabled BOOLEAN DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_profile_id ON profiles(public_profile_id);

-- Backfill stable public_profile_id for existing demo profiles if null
UPDATE profiles 
SET public_profile_id = 'maya-lin-8f2a'
WHERE id = 'user-maya-lin' AND public_profile_id IS NULL;

UPDATE profiles 
SET public_profile_id = 'alex-rivera-1a2b'
WHERE id = 'user-1' AND public_profile_id IS NULL;

UPDATE profiles 
SET public_profile_id = 'elena-rostova-4e1b'
WHERE id = 'user-2' AND public_profile_id IS NULL;

UPDATE profiles 
SET public_profile_id = 'marcus-vance-9c3d'
WHERE id = 'user-3' AND public_profile_id IS NULL;

UPDATE profiles 
SET public_profile_id = 'david-kim-7a8f'
WHERE id = 'user-4' AND public_profile_id IS NULL;

UPDATE profiles 
SET public_profile_id = 'priya-patel-2d5c'
WHERE id = 'user-5' AND public_profile_id IS NULL;

-- Fallback backfill for any other existing profiles
UPDATE profiles 
SET public_profile_id = 'pub_' || substr(md5(random()::text || id::text), 1, 12)
WHERE public_profile_id IS NULL;
