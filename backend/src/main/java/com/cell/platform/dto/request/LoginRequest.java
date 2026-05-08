package com.cell.platform.dto.request;

import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import java.util.Objects;

public record LoginRequest(
        String username,
        String password
) {
    public LoginRequest {
        validateNotBlank(username, "아이디");
        validateNotBlank(password, "비밀번호");
    }

    private void validateNotBlank(String value, String fieldName) {
        if (Objects.isNull(value) || value.isBlank()) {
            throw new BadRequestException(fieldName + "은(는) 비어있을 수 없습니다.", ErrorCode.G000);
        }
    }
}
