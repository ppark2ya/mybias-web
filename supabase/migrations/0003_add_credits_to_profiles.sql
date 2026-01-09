-- Add credits column to profiles table
-- Default value of 5 credits for new users
ALTER TABLE "profiles" ADD COLUMN "credits" integer DEFAULT 10 NOT NULL;
