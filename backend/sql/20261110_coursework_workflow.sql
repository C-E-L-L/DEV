-- Apply ONCE to an existing MySQL installation before starting with ddl-auto=validate.
-- Existing coursework remains published. New uploads are drafts until explicitly published.
ALTER TABLE tasks MODIFY COLUMN status ENUM('DRAFT','IN_PROGRESS','COMPLETED','ARCHIVED') NOT NULL;
ALTER TABLE tasks
    ADD COLUMN kind ENUM('DIAGNOSTIC','PRACTICE') NOT NULL DEFAULT 'PRACTICE',
    ADD COLUMN require_labels BIT NOT NULL DEFAULT 0,
    ADD COLUMN results_after_deadline BIT NOT NULL DEFAULT 0,
    ADD COLUMN revision BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN published_at DATETIME(6),
    ADD COLUMN prepared_at DATETIME(6);
UPDATE tasks SET kind = 'DIAGNOSTIC', require_labels = 1 WHERE uploaded_filename LIKE 'diagnostic-%';
UPDATE tasks SET published_at = created_at;
ALTER TABLE crops
    ADD COLUMN excluded BIT NOT NULL DEFAULT 0,
    ADD COLUMN exclusion_reason VARCHAR(500);

-- A row with a NULL class is an explicit "모르겠어요" answer. Missing row means unanswered.
ALTER TABLE submissions MODIFY COLUMN student_label VARCHAR(255) NULL;
ALTER TABLE crops MODIFY COLUMN gt_label VARCHAR(255), MODIFY COLUMN pseudo_label VARCHAR(255), MODIFY COLUMN final_label VARCHAR(255);
ALTER TABLE tasks ADD COLUMN class_labels TEXT;
UPDATE tasks SET class_labels='{"Band":"Band","Segment":"Segment","Lymphocyte":"Lymphocyte","Monocyte":"Monocyte","Eosinophil":"Eosinophil","NucleatedRBC":"NucleatedRBC"}';
ALTER TABLE animal_species ADD COLUMN active BIT NOT NULL DEFAULT 1;
CREATE TABLE cell_classes (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    species_id BIGINT NOT NULL,
    code VARCHAR(60) NOT NULL,
    name VARCHAR(100) NOT NULL,
    active BIT NOT NULL DEFAULT 1,
    CONSTRAINT uq_species_class UNIQUE(species_id, code),
    CONSTRAINT fk_class_species FOREIGN KEY(species_id) REFERENCES animal_species(id)
);
CREATE TABLE task_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    finalized_at DATETIME(6) NOT NULL,
    CONSTRAINT uq_task_attempt UNIQUE (task_id, student_id),
    CONSTRAINT fk_attempt_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
-- Preserve the old locked/completed behavior for already fully answered, fully graded scopes.
INSERT INTO task_attempts (task_id, student_id, finalized_at)
SELECT t.id, s.student_id, MAX(s.submitted_at)
FROM tasks t JOIN crops c ON c.task_id=t.id JOIN submissions s ON s.crop_id=c.id
WHERE NOT EXISTS (
    SELECT 1 FROM tasks sibling JOIN crops sc ON sc.task_id=sibling.id
    WHERE (sibling.id=t.id OR (t.assignment_id IS NOT NULL AND sibling.assignment_id=t.assignment_id))
      AND (sc.final_label IS NULL OR NOT EXISTS (SELECT 1 FROM submissions ss WHERE ss.crop_id=sc.id AND ss.student_id=s.student_id))
)
GROUP BY t.id, s.student_id;
