-- TTS Comparison Platform Database Schema
-- Run this in Supabase SQL Editor

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  elevenlabs_model TEXT NOT NULL DEFAULT 'eleven_turbo_v2_5',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed')),
  winner TEXT CHECK (winner IN ('heypixa', 'elevenlabs', 'tie')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report texts (3 category texts + custom)
CREATE TABLE IF NOT EXISTS report_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('names_places', 'currencies', 'date_time', 'custom')),
  text_content TEXT NOT NULL,
  order_index INT NOT NULL
);

-- Audio samples
CREATE TABLE IF NOT EXISTS audio_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_text_id UUID REFERENCES report_texts(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('heypixa', 'elevenlabs')),
  sample_index INT NOT NULL,
  audio_base64 TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  ttfb INT,
  latency INT
);

-- Critique results (stored as JSON)
CREATE TABLE IF NOT EXISTS critique_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  report_json JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE critique_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON reports
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for report_texts (access through report ownership)
CREATE POLICY "Users can view own report texts" ON report_texts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_texts.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own report texts" ON report_texts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_texts.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "Users can update own report texts" ON report_texts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_texts.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own report texts" ON report_texts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_texts.report_id AND reports.user_id = auth.uid())
  );

-- RLS Policies for audio_samples (access through report_text -> report ownership)
CREATE POLICY "Users can view own audio samples" ON audio_samples
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM report_texts 
      JOIN reports ON reports.id = report_texts.report_id 
      WHERE report_texts.id = audio_samples.report_text_id AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own audio samples" ON audio_samples
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM report_texts 
      JOIN reports ON reports.id = report_texts.report_id 
      WHERE report_texts.id = audio_samples.report_text_id AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own audio samples" ON audio_samples
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM report_texts 
      JOIN reports ON reports.id = report_texts.report_id 
      WHERE report_texts.id = audio_samples.report_text_id AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own audio samples" ON audio_samples
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM report_texts 
      JOIN reports ON reports.id = report_texts.report_id 
      WHERE report_texts.id = audio_samples.report_text_id AND reports.user_id = auth.uid()
    )
  );

-- RLS Policies for critique_results
CREATE POLICY "Users can view own critique results" ON critique_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = critique_results.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own critique results" ON critique_results
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = critique_results.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "Users can update own critique results" ON critique_results
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = critique_results.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own critique results" ON critique_results
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = critique_results.report_id AND reports.user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_texts_report_id ON report_texts(report_id);
CREATE INDEX IF NOT EXISTS idx_audio_samples_report_text_id ON audio_samples(report_text_id);
CREATE INDEX IF NOT EXISTS idx_critique_results_report_id ON critique_results(report_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
