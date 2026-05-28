package com.cell.platform.infra.report;

import com.cell.platform.entity.CropIssueReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CropIssueReportJpaRepository extends JpaRepository<CropIssueReportEntity, Long> {

    @Modifying
    @Query("DELETE FROM CropIssueReportEntity r WHERE r.taskId = :taskId")
    void deleteAllByTaskId(@Param("taskId") Long taskId);
}
