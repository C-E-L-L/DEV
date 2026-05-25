package com.cell.platform.dto.request;

import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;

import java.util.Objects;

public record CropIssueReportRequest(
        Long taskId,
        Long cropId,
        String studentId,
        String reason
) {
    public CropIssueReportRequest {
        if (Objects.isNull(taskId)) {
            throw new BadRequestException("taskId는 필수입니다.", ErrorCode.G000);
        }
        if (Objects.isNull(cropId)) {
            throw new BadRequestException("cropId는 필수입니다.", ErrorCode.G000);
        }
        validateNotBlank(studentId, "studentId");
        validateNotBlank(reason, "reason");
    }

    private void validateNotBlank(String value, String fieldName) {
        if (Objects.isNull(value) || value.isBlank()) {
            throw new BadRequestException(fieldName + "은(는) 비어있을 수 없습니다.", ErrorCode.G000);
        }
    }
}
