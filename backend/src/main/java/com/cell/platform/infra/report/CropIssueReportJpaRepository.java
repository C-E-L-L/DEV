package com.cell.platform.infra.report;

import com.cell.platform.entity.CropIssueReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CropIssueReportJpaRepository extends JpaRepository<CropIssueReportEntity, Long> {
}
