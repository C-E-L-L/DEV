-- Apply ONCE to an existing MySQL installation before starting with ddl-auto=validate.
-- Class list import (학번·성명·분반) for the professor console. Existing roster rows keep NULL.
ALTER TABLE student_roster
    ADD COLUMN name VARCHAR(100),
    ADD COLUMN section VARCHAR(50);
