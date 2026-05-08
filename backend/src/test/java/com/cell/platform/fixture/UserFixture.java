package com.cell.platform.fixture;

import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.entity.UserEntity;

public class UserFixture {

    public static User createDomain() {
        return User.builder()
                .id(1L)
                .username("student01")
                .password("$2a$10$hashed")
                .role(Role.STUDENT)
                .build();
    }

    public static UserEntity createEntity() {
        return UserEntity.builder()
                .id(1L)
                .username("student01")
                .password("$2a$10$hashed")
                .role(Role.STUDENT)
                .build();
    }
}