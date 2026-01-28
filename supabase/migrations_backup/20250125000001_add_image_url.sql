-- Add image_url column to projects table
-- This migration adds image_url support to the platform_modernization schema

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN projects.image_url IS 'URL of the project image/cover photo';
