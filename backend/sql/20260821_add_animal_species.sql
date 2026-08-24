-- 운영(prod: ddl-auto=validate) 배포 전에 1회 실행한다.
-- tasks의 각 행은 도말 이미지 한 장을 나타낸다.
-- 현재 저장된 모든 도말/진단평가 데이터는 Dog이므로 기존 도말을 DOG로 보정한다.

CREATE TABLE IF NOT EXISTS animal_species (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(60) NOT NULL,
    built_in BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_animal_species_code (code),
    UNIQUE KEY uk_animal_species_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO animal_species (code, name, built_in, created_at, updated_at)
VALUES ('DOG', '개 (Dog)', b'1', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE built_in = b'1';

INSERT INTO animal_species (code, name, built_in, created_at, updated_at)
VALUES ('CAT', '고양이 (Cat)', b'1', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE built_in = b'1';

ALTER TABLE tasks ADD COLUMN animal_species_id BIGINT NULL;

UPDATE tasks
SET animal_species_id = (SELECT id FROM animal_species WHERE code = 'DOG' LIMIT 1)
WHERE animal_species_id IS NULL;

ALTER TABLE tasks
    MODIFY animal_species_id BIGINT NOT NULL,
    ADD INDEX idx_tasks_animal_species_id (animal_species_id),
    ADD CONSTRAINT fk_tasks_animal_species
        FOREIGN KEY (animal_species_id) REFERENCES animal_species (id);
