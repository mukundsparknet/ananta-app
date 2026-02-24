-- Fix PostgreSQL LOB issue by changing TEXT to VARCHAR
ALTER TABLE users ALTER COLUMN profile_image TYPE VARCHAR(10485760);
