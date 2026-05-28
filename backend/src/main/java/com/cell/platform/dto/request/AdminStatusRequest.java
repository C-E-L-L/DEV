package com.cell.platform.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminStatusRequest(
        @NotBlank String status
) {
}
