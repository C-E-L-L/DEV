package com.cell.platform.infra.report;

import com.cell.platform.entity.CropIssueReplyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CropIssueReplyJpaRepository extends JpaRepository<CropIssueReplyEntity, Long> {
    List<CropIssueReplyEntity> findAllByReportIdInOrderByCreatedAtAscIdAsc(List<Long> reportIds);
}
