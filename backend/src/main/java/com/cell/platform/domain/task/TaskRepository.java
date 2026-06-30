package com.cell.platform.domain.task;

import java.util.List;
import java.util.Optional;

public interface TaskRepository {

    Task save(Task task);

    Optional<Task> findById(Long id);

    List<Task> findAllByOrderByIdDesc();

    List<Long> findIdsByUploadedFilenameStartingWith(String prefix);

    List<Task> findByAssignmentId(Long assignmentId);

    void deleteById(Long id);
}
