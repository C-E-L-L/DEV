package com.cell.platform.domain.matrix;

import com.cell.platform.entity.StudentConfusionMatrixEntity;
import java.util.List;
import java.util.Optional;

public interface ConfusionMatrixRepository {
    Optional<StudentConfusionMatrixEntity> findByStudentIdAndTaskId(String studentId, Long taskId);
    // [추가된 부분] 특정 과제의 모든 혼동행렬 조회
    List<StudentConfusionMatrixEntity> findAllByTaskId(Long taskId);
    List<StudentConfusionMatrixEntity> findAllByTaskIdIn(List<Long> taskIds);

    StudentConfusionMatrixEntity save(StudentConfusionMatrixEntity entity);
}