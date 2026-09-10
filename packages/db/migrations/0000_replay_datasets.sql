CREATE TABLE IF NOT EXISTS replay_datasets (
  id text PRIMARY KEY,
  market_id text NOT NULL,
  captured_at timestamptz NOT NULL,
  integrity_hash text NOT NULL,
  source jsonb NOT NULL,
  derived jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS replay_datasets_market_id_idx ON replay_datasets (market_id);

CREATE TABLE IF NOT EXISTS live_capture_records (
  id text PRIMARY KEY,
  market_id text NOT NULL,
  captured_at timestamptz NOT NULL,
  kind text NOT NULL,
  block_number numeric(78,0),
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS live_capture_records_market_id_idx ON live_capture_records (market_id, captured_at);
