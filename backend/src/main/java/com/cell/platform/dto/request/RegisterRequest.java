package com.cell.platform.dto.request;

import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import jakarta.validation.constraints.NotBlank;

import java.util.Objects;

public record RegisterRequest(
        @NotBlank(message = "아이디는 비어있을 수 없습니다.")
        String username,
        @NotBlank(message = "비밀번호는 비어있을 수 없습니다.")
        String password,
        String role
) {
}
