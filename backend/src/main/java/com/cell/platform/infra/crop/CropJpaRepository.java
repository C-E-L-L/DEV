package com.cell.platform.infra.crop;

import com.cell.platform.entity.CropEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CropJpaRepository extends JpaRepository<CropEntity, Long> {

    List<CropEntity> findAllByTask_Id(Long taskId);

    List<CropEntity> findAllByFinalLabelIsNotNull();
}
