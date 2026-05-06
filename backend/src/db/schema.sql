CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  year_level VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dass21_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  answers JSON NOT NULL,
  depression_score INT NOT NULL,
  anxiety_score INT NOT NULL,
  stress_score INT NOT NULL,
  total_score INT NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cssrs_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item1 TINYINT(1) NOT NULL,
  item2 TINYINT(1) NOT NULL,
  item3 TINYINT(1) NOT NULL,
  item4 TINYINT(1) NOT NULL,
  item5 TINYINT(1) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  rationale TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS esm_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mood TINYINT NOT NULL,
  energy TINYINT NOT NULL,
  stress TINYINT NOT NULL,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ogc_hotlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  description TEXT,
  is_24_7 TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE (name, phone),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO ogc_hotlines (name, phone, description, is_24_7, is_active)
VALUES
  ('NCMH Crisis Hotline', '1553', 'National Center for Mental Health 24/7 support', 1, 1),
  ('Hopeline PH', '+63 917 558 4673', 'Hopeline psychological support', 1, 1);
