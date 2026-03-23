CREATE TABLE IF NOT EXISTS pending_registrations (
  id SERIAL PRIMARY KEY,
  photo TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  age INTEGER NOT NULL,
  city TEXT NOT NULL,
  motivation TEXT,
  transaction_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  photo TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  age INTEGER NOT NULL,
  city TEXT NOT NULL,
  motivation TEXT,
  transaction_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_name
ON candidates (first_name, last_name);

ALTER TABLE pending_registrations
  ALTER COLUMN photo DROP NOT NULL;

ALTER TABLE candidates
  ALTER COLUMN photo DROP NOT NULL;

CREATE TABLE IF NOT EXISTS admin_access (
  id SERIAL PRIMARY KEY,
  name TEXT,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_access_created_at
ON admin_access (created_at DESC);
