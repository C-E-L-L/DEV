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

    @Query("select c.task.id, count(c) from CropEntity c group by c.task.id")
    List<Object[]> countByTaskId();

    @Query("select c.task.id, count(c) from CropEntity c where c.finalLabel is not null group by c.task.id")
    List<Object[]> countLabeledByTaskId();

    @Query("select c from CropEntity c join fetch c.task t where t.originalFilename is not null")
    List<CropEntity> findAllWithTaskOriginalFilename();

    List<CropEntity> findAllByTask_IdIn(List<Long> taskIds);
}
