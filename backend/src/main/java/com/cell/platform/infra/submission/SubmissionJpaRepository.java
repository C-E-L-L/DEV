package com.cell.platform.infra.submission;

import com.cell.platform.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionJpaRepository extends JpaRepository<SubmissionEntity, Long> {

    List<SubmissionEntity> findAllByCrop_Id(Long cropId);

    List<SubmissionEntity> findAllByCrop_IdIn(List<Long> cropIds);

    List<SubmissionEntity> findAllByCrop_IdInAndStudentId(List<Long> cropIds, String studentId);
}
