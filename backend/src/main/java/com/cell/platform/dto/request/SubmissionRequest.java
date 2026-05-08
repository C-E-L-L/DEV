package com.cell.platform.dto.request;

import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import java.util.Objects;

public record SubmissionRequest(
        Long cropId,
        String studentId,
        String studentLabel
) {
    public SubmissionRequest {
        if (Objects.isNull(cropId)) {
            throw new BadRequestException("cropId는 필수입니다.", ErrorCode.G000);
        }
        validateNotBlank(studentId, "studentId");
        validateNotBlank(studentLabel, "studentLabel");
    }

    private void validateNotBlank(String value, String fieldName) {
        if (Objects.isNull(value) || value.isBlank()) {
            throw new BadRequestException(fieldName + "은(는) 비어있을 수 없습니다.", ErrorCode.G000);
        }
    }
}
