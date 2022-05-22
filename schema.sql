DROP TABLE IF EXISTS plants;

CREATE TABLE IF NOT EXISTS outings (
  outing_id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS people (
  person_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  expense_id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount NUMERIC(9,2) NOT NULL, -- 9 precision, 2 scale means we can store dollars between +/- 9,999,999.99
  description TEXT
);
