package com.cell.platform.dto.response;

import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.UserStatus;
import com.cell.platform.entity.UserEntity;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String username,
        String name,
        Role role,
        UserStatus status,
        LocalDateTime createdAt
) {
    public static AdminUserResponse from(UserEntity user) {
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
