package com.cell.platform.infra.submission;

import com.cell.platform.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SubmissionJpaRepository extends JpaRepository<SubmissionEntity, Long> {

    List<SubmissionEntity> findAllByCrop_Id(Long cropId);

    List<SubmissionEntity> findAllByCrop_IdIn(List<Long> cropIds);

    List<SubmissionEntity> findAllByCrop_IdInAndStudentId(List<Long> cropIds, String studentId);

    @Modifying
    @Query("DELETE FROM SubmissionEntity s WHERE s.crop.id IN :cropIds")
    void deleteAllByCropIdIn(@Param("cropIds") List<Long> cropIds);
}
