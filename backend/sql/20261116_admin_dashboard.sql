-- Apply once BEFORE deploying this version with the prod validate profile.
-- Additive only: existing users, submissions and coursework remain intact.
ALTER TABLE users ADD COLUMN credential_version BIGINT NOT NULL DEFAULT 0;
CREATE TABLE announcements (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    audience ENUM('ALL','STUDENT','EXPERT') NOT NULL,
    urgent BIT NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL
);
