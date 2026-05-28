package com.cell.platform.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminPasswordResetRequest(
        @NotBlank String password
) {
}
