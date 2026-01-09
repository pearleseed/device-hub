-- Migration: Add mattermost_username column to users table
-- This column stores the Mattermost username for notification purposes
-- If not set, the system will derive it from the email prefix

-- Add the column (nullable to support existing users)
ALTER TABLE users 
ADD COLUMN mattermost_username VARCHAR(100) NULL 
AFTER email;

-- Add index for faster lookups
CREATE INDEX idx_users_mattermost_username ON users(mattermost_username);

-- Optional: Update existing users to use email prefix as default
-- Uncomment if you want to auto-populate for existing users
-- UPDATE users SET mattermost_username = SUBSTRING_INDEX(email, '@', 1) WHERE mattermost_username IS NULL;
