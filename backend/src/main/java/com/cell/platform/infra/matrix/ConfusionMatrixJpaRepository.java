package com.cell.platform.infra.matrix;

import com.cell.platform.entity.StudentConfusionMatrixEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfusionMatrixJpaRepository extends JpaRepository<StudentConfusionMatrixEntity, Long> {
    Optional<StudentConfusionMatrixEntity> findByStudentIdAndTaskId(String studentId, Long taskId);
    List<StudentConfusionMatrixEntity> findAllByTaskId(Long taskId);
    List<StudentConfusionMatrixEntity> findAllByTaskIdIn(List<Long> taskIds);

    @Modifying
    @Query("DELETE FROM StudentConfusionMatrixEntity m WHERE m.taskId = :taskId")
    void deleteAllByTaskId(@Param("taskId") Long taskId);
}