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
  outing_id INTEGER NOT NULL REFERENCES outings(outing_id),
  person_id INTEGER NOT NULL REFERENCES people(person_id),
  amount NUMERIC(9,4) NOT NULL, -- 9 precision, 4 scale means we can store dollars between +/- 99,999.9999
  description TEXT
);

CREATE TABLE IF NOT EXISTS outing_people (
  outing_id INTEGER REFERENCES outings(outing_id),
  person_id INTEGER REFERENCES people(person_id),
  PRIMARY KEY (outing_id, person_id)
);
