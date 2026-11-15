-- Apply once to the existing MySQL database before starting this version with ddl-auto=validate.
ALTER TABLE crop_issue_reports MODIFY COLUMN reason TEXT NOT NULL;

CREATE TABLE crop_issue_replies (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    author_username VARCHAR(255) NOT NULL,
    author_name VARCHAR(255),
    author_role VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    INDEX idx_reply_report (report_id),
    CONSTRAINT fk_reply_report FOREIGN KEY (report_id)
        REFERENCES crop_issue_reports(id) ON DELETE CASCADE
);
