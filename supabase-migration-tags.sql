-- Migration: Add tags JSONB column to phrases table
-- Run this in your Supabase SQL Editor if you already have the tables created

-- 1. Add the tags column
ALTER TABLE phrases
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 2. Migrate existing data: populate tags from tag_to_learn and tag_to_learn_meaning
UPDATE phrases
SET tags = jsonb_build_array(
  jsonb_build_object(
    'word', tag_to_learn,
    'meaning', tag_to_learn_meaning
  )
)
WHERE tags = '[]'::jsonb AND tag_to_learn IS NOT NULL AND tag_to_learn != '';

-- 3. Add GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_phrases_tags ON phrases USING GIN (tags);
