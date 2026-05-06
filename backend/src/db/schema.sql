CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  year_level VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dass21_assessments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  depression_score INTEGER NOT NULL,
  anxiety_score INTEGER NOT NULL,
  stress_score INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cssrs_assessments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item1 BOOLEAN NOT NULL,
  item2 BOOLEAN NOT NULL,
  item3 BOOLEAN NOT NULL,
  item4 BOOLEAN NOT NULL,
  item5 BOOLEAN NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS esm_checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ogc_hotlines (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  description TEXT,
  is_24_7 BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (name, phone),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ogc_hotlines (name, phone, description, is_24_7, is_active)
VALUES
  ('NCMH Crisis Hotline', '1553', 'National Center for Mental Health 24/7 support', TRUE, TRUE),
  ('Hopeline PH', '+63 917 558 4673', 'Hopeline psychological support', TRUE, TRUE)
ON CONFLICT DO NOTHING;
