package com.cell.platform.infra.submission;

import com.cell.platform.entity.TaskAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskAttemptJpaRepository extends JpaRepository<TaskAttemptEntity, Long> {
    boolean existsByTaskIdInAndStudentId(List<Long> taskIds, String studentId);
    void deleteAllByTaskId(Long taskId);
}
