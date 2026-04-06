USE job_tracker;

ALTER TABLE users
  ADD COLUMN username         VARCHAR(50)  UNIQUE,
  ADD COLUMN headline         VARCHAR(255),
  ADD COLUMN bio              TEXT,
  ADD COLUMN location         VARCHAR(255),
  ADD COLUMN website          VARCHAR(500),
  ADD COLUMN linkedin_url     VARCHAR(500),
  ADD COLUMN twitter          VARCHAR(100),
  ADD COLUMN portfolio_public BOOLEAN NOT NULL DEFAULT FALSE;

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
