package com.cell.platform.entity;

import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String name;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (this.status == null) {
            this.status = UserStatus.ACTIVE;
        }
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    private UserEntity(Long id, String username, String name, String password, Role role, UserStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.password = password;
        this.role = role;
        this.status = status == null ? UserStatus.ACTIVE : status;
        this.createdAt = createdAt;
    }

    public void changeStatus(UserStatus status) {
        this.status = status;
    }
}
