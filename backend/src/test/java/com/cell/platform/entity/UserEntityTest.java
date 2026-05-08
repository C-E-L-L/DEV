package com.cell.platform.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.cell.platform.domain.user.Role;
import com.cell.platform.entity.UserEntity;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UserEntityTest {

    @Nested
    class UserEntity는 {

        @Test
        void 빌더로_정상적으로_생성된다() {
            // when
            UserEntity user = UserEntity.builder()
                    .id(1L).username("student01")
                    .password("$2a$10$hashed").role(Role.STUDENT)
                    .build();

            // then
            assertAll(
                    () -> assertThat(user.getId()).isEqualTo(1L),
                    () -> assertThat(user.getUsername()).isEqualTo("student01"),
                    () -> assertThat(user.getPassword()).isEqualTo("$2a$10$hashed"),
                    () -> assertThat(user.getRole()).isEqualTo(Role.STUDENT)
            );
        }
    }
}