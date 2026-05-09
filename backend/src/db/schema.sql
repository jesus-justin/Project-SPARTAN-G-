CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  college VARCHAR(100) DEFAULT NULL,
  year_level INT DEFAULT NULL,
  program VARCHAR(100) DEFAULT NULL,
  sex CHAR(1) DEFAULT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS college VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS year_level INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS program VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sex CHAR(1) DEFAULT NULL;

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

CREATE TABLE IF NOT EXISTS ogc_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  facilitator_user_id INT NULL,
  risk_level VARCHAR(32) NULL,
  title VARCHAR(255),
  body TEXT,
  seen TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phq9_responses (
  response_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(50),
  cycle_id VARCHAR(36),
  answers JSON NOT NULL,
  total_score INT NOT NULL,
  severity VARCHAR(30),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gad7_responses (
  response_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(50),
  cycle_id VARCHAR(36),
  answers JSON NOT NULL,
  total_score INT NOT NULL,
  severity VARCHAR(30),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ginhawa_content (
  content_id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type VARCHAR(50),
  content_url TEXT,
  risk_levels JSON,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft',
  created_by INT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_plans (
  plan_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(50),
  warning_signs TEXT,
  coping_strategies TEXT,
  social_supports TEXT,
  professional_contacts TEXT,
  safe_environment TEXT,
  reasons_to_live TEXT,
  emergency_contacts TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(50),
  facilitator_id INT,
  scheduled_at DATETIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  risk_level_at_booking VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (facilitator_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fcm_tokens (
  token_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(50),
  fcm_token TEXT NOT NULL,
  platform VARCHAR(20),
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS esm_schedules (
  schedule_id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(50),
  morning_sent TINYINT DEFAULT 0,
  afternoon_sent TINYINT DEFAULT 0,
  evening_sent TINYINT DEFAULT 0,
  schedule_date DATE,
  entries_count INT DEFAULT 0,
  is_sufficient TINYINT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risk_classifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dass21_score INT,
  phq9_score INT,
  gad7_score INT,
  trajectory VARCHAR(30) DEFAULT 'Stable',
  risk_level VARCHAR(20),
  mood_slope DECIMAL(5, 2),
  energy_slope DECIMAL(5, 2),
  shap_drivers JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO ogc_hotlines (name, phone, description, is_24_7, is_active)
VALUES
  ('NCMH Crisis Hotline', '1553', 'National Center for Mental Health 24/7 support', 1, 1),
  ('Hopeline PH', '+63 917 558 4673', 'Hopeline psychological support', 1, 1);
