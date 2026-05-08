package com.cell.platform.dto.request;

import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import java.util.Objects;

public record ConfirmRequest(
        String finalLabel
) {
    public ConfirmRequest {
        if (Objects.isNull(finalLabel) || finalLabel.isBlank()) {
            throw new BadRequestException("최종 라벨은 비어있을 수 없습니다.", ErrorCode.G000);
        }
    }
}
