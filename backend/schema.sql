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
  application_id  VARCHAR(36) NOT NULL,
  fit_score       INT,
  verdict         VARCHAR(50),
  missing_keywords JSON,
  strengths        JSON,
  suggestions      TEXT,
  cover_letter     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Portfolio / public profile
ALTER TABLE users
  ADD COLUMN username           VARCHAR(50)  UNIQUE,
  ADD COLUMN headline           VARCHAR(255),
  ADD COLUMN bio                TEXT,
  ADD COLUMN location           VARCHAR(255),
  ADD COLUMN website            VARCHAR(500),
  ADD COLUMN linkedin_url       VARCHAR(500),
  ADD COLUMN twitter            VARCHAR(100),
  ADD COLUMN portfolio_public   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS work_experience (
  id             VARCHAR(36)  PRIMARY KEY,
  user_id        VARCHAR(36)  NOT NULL,
  company        VARCHAR(255),
  title          VARCHAR(255),
  start_date     DATE,
  end_date       DATE,
  current_role   BOOLEAN      NOT NULL DEFAULT FALSE,
  description    TEXT,
  display_order  INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id             VARCHAR(36)  PRIMARY KEY,
  user_id        VARCHAR(36)  NOT NULL,
  name           VARCHAR(100) NOT NULL,
  category       VARCHAR(50),
  display_order  INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id             VARCHAR(36)  PRIMARY KEY,
  user_id        VARCHAR(36)  NOT NULL,
  title          VARCHAR(255),
  description    TEXT,
  url            VARCHAR(500),
  repo_url       VARCHAR(500),
  display_order  INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_media (
  id             VARCHAR(36)  PRIMARY KEY,
  project_id     VARCHAR(36)  NOT NULL,
  type           ENUM('image', 'video') NOT NULL,
  url            VARCHAR(500) NOT NULL,
  caption        VARCHAR(255),
  display_order  INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
