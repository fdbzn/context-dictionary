-- Run this SQL in your Supabase SQL Editor to set up the database

-- 1. Phrases table
CREATE TABLE phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  meaning TEXT,
  tag_to_learn TEXT NOT NULL,
  tag_to_learn_meaning TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own phrases
CREATE POLICY "Users can manage their own phrases"
  ON phrases
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_phrases_user_id ON phrases(user_id);
CREATE INDEX idx_phrases_created_at ON phrases(created_at DESC);

-- 2. Study sessions table
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  user_example TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own study sessions
CREATE POLICY "Users can manage their own study sessions"
  ON study_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_phrase_id ON study_sessions(phrase_id);
CREATE INDEX idx_study_sessions_created_at ON study_sessions(created_at DESC);
CREATE INDEX idx_study_sessions_correct ON study_sessions(user_id, is_correct);

-- 3. User settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phrases_per_session INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own settings
CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Index for tags (GIN index for JSONB)
CREATE INDEX idx_phrases_tags ON phrases USING GIN (tags);

-- 5. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phrases_updated_at
  BEFORE UPDATE ON phrases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
