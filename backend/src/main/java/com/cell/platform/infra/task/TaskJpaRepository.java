package com.cell.platform.infra.task;

import com.cell.platform.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskJpaRepository extends JpaRepository<TaskEntity, Long> {

    List<TaskEntity> findAllByOrderByIdDesc();

    @Query("""
            select t from TaskEntity t
            where t.originalFilename is not null
              and t.originalFilename <> ''
              and (t.uploadedFilename is null or t.uploadedFilename not like 'diagnostic-%')
            order by t.id desc
            """)
    List<TaskEntity> findAllUploadedSmearsOrderByIdDesc();

    @Query("select t.id from TaskEntity t where t.uploadedFilename like concat(:prefix, '%')")
    List<Long> findIdsByUploadedFilenameStartingWith(@Param("prefix") String prefix);

    List<TaskEntity> findAllByAssignmentId(Long assignmentId);

    List<TaskEntity> findAllByAnimalSpeciesIsNull();

    @Query("select t.id from TaskEntity t where t.assignmentId = :assignmentId")
    List<Long> findIdsByAssignmentId(@Param("assignmentId") Long assignmentId);
}
