package com.cell.platform.infra.matrix;

import com.cell.platform.entity.StudentConfusionMatrixEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfusionMatrixJpaRepository extends JpaRepository<StudentConfusionMatrixEntity, Long> {
    Optional<StudentConfusionMatrixEntity> findByStudentIdAndTaskId(String studentId, Long taskId);
    // [추가된 부분]
    List<StudentConfusionMatrixEntity> findAllByTaskId(Long taskId);
}