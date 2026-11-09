package com.cell.platform.dto.response;

import com.cell.platform.entity.CropIssueReportEntity;

import java.time.LocalDateTime;
import java.util.List;

public record CropIssueReportResponse(
        Long id,
        String studentId,
        Long taskId,
        Long cropId,
        String cropFilename,
        String speciesCode,
        String speciesName,
        String reason,
        LocalDateTime createdAt,
        List<CropIssueReplyResponse> replies
) {
    public static CropIssueReportResponse from(CropIssueReportEntity entity, String cropFilename,
                                               String speciesCode, String speciesName,
                                               List<CropIssueReplyResponse> replies) {
        return new CropIssueReportResponse(
                entity.getId(),
                entity.getStudentId(),
                entity.getTaskId(),
                entity.getCropId(),
                cropFilename,
                speciesCode,
                speciesName,
                entity.getReason(),
                entity.getCreatedAt(),
                replies
        );
    }
}
