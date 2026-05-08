package com.cell.platform.infra.matrix;

import com.cell.platform.domain.matrix.ConfusionMatrixRepository;
import com.cell.platform.entity.StudentConfusionMatrixEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ConfusionMatrixCoreRepository implements ConfusionMatrixRepository {

    private final ConfusionMatrixJpaRepository jpaRepository;

    @Override
    public Optional<StudentConfusionMatrixEntity> findByStudentIdAndTaskId(String studentId, Long taskId) {
        // 수정된 부분: String, Long 타입을 빼고 변수명만 전달!
        return jpaRepository.findByStudentIdAndTaskId(studentId, taskId);
    }

    // [추가된 부분] Override 구현
    @Override
    public List<StudentConfusionMatrixEntity> findAllByTaskId(Long taskId) {
        return jpaRepository.findAllByTaskId(taskId);
    }

    @Override
    public StudentConfusionMatrixEntity save(StudentConfusionMatrixEntity entity) {
        return jpaRepository.save(entity);
    }
}