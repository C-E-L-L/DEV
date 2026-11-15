package com.cell.platform.domain.task;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface TaskRepository {

    Task save(Task task);

    Optional<Task> findById(Long id);

    List<Task> findAllByOrderByIdDesc();

    List<Long> findIdsByUploadedFilenameStartingWith(String prefix);

    List<Task> findByAssignmentId(Long assignmentId);

    void updateDeadlineAt(Long taskId, LocalDateTime deadlineAt);

    void updateDeadlineAtByAssignmentId(Long assignmentId, LocalDateTime deadlineAt);

    void deleteById(Long id);
}
