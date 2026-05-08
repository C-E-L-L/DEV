package com.cell.platform.infra.task;

import com.cell.platform.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskJpaRepository extends JpaRepository<TaskEntity, Long> {

    List<TaskEntity> findAllByOrderByIdDesc();
}
