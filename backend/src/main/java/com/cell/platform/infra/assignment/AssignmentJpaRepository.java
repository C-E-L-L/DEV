package com.cell.platform.infra.assignment;

import com.cell.platform.entity.AssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentJpaRepository extends JpaRepository<AssignmentEntity, Long> {
    List<AssignmentEntity> findAllByOrderByIdDesc();
}
