-- visitors テーブル
CREATE TABLE visitors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON visitors FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;

-- visits テーブル
CREATE TABLE visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  memo        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_visits_start_time ON visits(start_time);
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON visits FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE visits;

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER visits_updated_at
BEFORE UPDATE ON visits
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
