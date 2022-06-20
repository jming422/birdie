CREATE TABLE IF NOT EXISTS outings (
  outing_id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outing_people (
  outing_id INTEGER REFERENCES outings(outing_id),
  name TEXT,
  PRIMARY KEY (outing_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
  expense_id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  outing_id INTEGER NOT NULL REFERENCES outings(outing_id),
  person_name TEXT NOT NULL,
  amount NUMERIC(9,4) NOT NULL, -- 9 precision, 4 scale means we can store dollars between +/- 99,999.9999
  description TEXT,
  FOREIGN KEY (outing_id, person_name) REFERENCES outing_people(outing_id, name)
);
