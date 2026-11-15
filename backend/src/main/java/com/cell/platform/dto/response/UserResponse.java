package com.cell.platform.dto.response;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String name,
        String role,
        String status,
        LocalDateTime createdAt
) {}
