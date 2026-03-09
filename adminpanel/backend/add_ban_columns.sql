-- Add ban_until and ban_reason columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(500);

-- Update existing banned users to have permanent ban reason
UPDATE users SET ban_reason = 'Permanently banned' WHERE is_banned = true AND ban_reason IS NULL;
