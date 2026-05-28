package com.cell.platform.domain.user;

import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class User {

    private Long id;
    private String username;
    private String name;
    private String password;
    private Role role;
    private UserStatus status;
    private LocalDateTime createdAt;

    @Builder
    public User(Long id, String username, String name, String password, Role role, UserStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.password = password;
        this.role = role;
        this.status = status == null ? UserStatus.ACTIVE : status;
        this.createdAt = createdAt;
    }

    public static User create(String username, String name, String password, Role role) {
        return create(username, name, password, role, UserStatus.ACTIVE);
    }

    public static User create(String username, String name, String password, Role role, UserStatus status) {
        return User.builder()
                .username(username)
                .name(name)
                .password(password)
                .role(role)
                .status(status)
                .build();
    }

    public static User create(String username, String password, Role role) {
        return create(username, null, password, role);
    }

}
