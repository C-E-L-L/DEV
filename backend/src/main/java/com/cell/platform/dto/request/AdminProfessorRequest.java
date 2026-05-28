package com.cell.platform.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminProfessorRequest(
        @NotBlank String username,
        String name,
        @NotBlank String password
) {
}
