USE job_tracker;

CREATE TABLE IF NOT EXISTS education (
  id              VARCHAR(36)  PRIMARY KEY,
  user_id         VARCHAR(36)  NOT NULL,
  school          VARCHAR(255) NULL,
  degree          VARCHAR(100) NULL,
  field_of_study  VARCHAR(255) NULL,
  start_date      DATE         NULL,
  end_date        DATE         NULL,
  current_student BOOLEAN      NOT NULL DEFAULT FALSE,
  description     TEXT         NULL,
  display_order   INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
