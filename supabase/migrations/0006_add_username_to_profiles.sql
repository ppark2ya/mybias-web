-- Add username column to profiles table
-- This enables username-based authentication alongside email-based auth

-- Add username column (nullable initially for existing users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Add unique constraint to ensure usernames are unique
ALTER TABLE profiles ADD CONSTRAINT username_unique UNIQUE (username);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add check constraint for username format
-- Username must be 3-20 characters, alphanumeric and underscores only
ALTER TABLE profiles ADD CONSTRAINT username_format_check 
  CHECK (username IS NULL OR (
    LENGTH(username) >= 3 AND 
    LENGTH(username) <= 20 AND 
    username ~ '^[a-zA-Z0-9_]+$'
  ));
