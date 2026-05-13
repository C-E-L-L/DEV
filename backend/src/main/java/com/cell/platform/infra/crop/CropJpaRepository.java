package com.cell.platform.infra.crop;

import com.cell.platform.entity.CropEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CropJpaRepository extends JpaRepository<CropEntity, Long> {

    List<CropEntity> findAllByTask_Id(Long taskId);

    List<CropEntity> findAllByFinalLabelIsNotNull();

    @Query("select distinct c.task.id from CropEntity c where c.finalLabel is not null")
    List<Long> findDistinctTaskIdsByFinalLabelIsNotNull();
}
