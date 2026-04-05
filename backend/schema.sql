CREATE DATABASE IF NOT EXISTS job_tracker;
USE job_tracker;

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36) PRIMARY KEY,
  google_id     VARCHAR(255) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  display_name  VARCHAR(255),
  avatar_url    VARCHAR(500),
  resume_text   TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id              VARCHAR(36) PRIMARY KEY,
  user_id         VARCHAR(36) NOT NULL,
  company_name    VARCHAR(255),
  role_title      VARCHAR(255),
  job_description TEXT,
  job_url         VARCHAR(500),
  source          VARCHAR(50),
  status          VARCHAR(50) NOT NULL DEFAULT 'saved',
  date_applied    DATE,
  salary_min      INT,
  salary_max      INT,
  currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
  notes           TEXT,
  location        VARCHAR(255),
  remote          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS status_history (
  id              VARCHAR(36) PRIMARY KEY,
  application_id  VARCHAR(36) NOT NULL,
  old_status      VARCHAR(50),
  new_status      VARCHAR(50),
  changed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id              VARCHAR(36) PRIMARY KEY,
  application_id  VARCHAR(36) UNIQUE NOT NULL,
  fit_score       INT,
  verdict         VARCHAR(50),
  missing_keywords JSON,
  strengths        JSON,
  suggestions      TEXT,
  cover_letter     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
