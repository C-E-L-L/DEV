package com.cell.platform.infra;

import com.cell.platform.context.RepositoryContext;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

class UserCoreRepositoryTest extends RepositoryContext {

    @Autowired
    private UserRepository userRepository;

    @Nested
    class save_메서드는 {

        @Test
        void 사용자를_저장하고_ID를_부여한다() {
            // given
            User user = User.create("student01", "$2a$10$hashed", Role.STUDENT);

            // when
            User saved = userRepository.save(user);

            // then
            assertAll(
                    () -> assertThat(saved.getId()).isNotNull(),
                    () -> assertThat(saved.getUsername()).isEqualTo("student01"),
                    () -> assertThat(saved.getPassword()).isEqualTo("$2a$10$hashed"),
                    () -> assertThat(saved.getRole()).isEqualTo(Role.STUDENT),
                    () -> assertThat(saved.getCreatedAt()).isNotNull()
            );
        }
    }

    @Nested
    class findByUsername_메서드는 {

        @Test
        void 존재하는_사용자를_조회한다() {
            // given
            userRepository.save(User.create("expert01", "$2a$10$hashed", Role.EXPERT));

            // when
            Optional<User> found = userRepository.findByUsername("expert01");

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getUsername()).isEqualTo("expert01");
            assertThat(found.get().getRole()).isEqualTo(Role.EXPERT);
        }

        @Test
        void 존재하지_않는_사용자는_빈값을_반환한다() {
            // when
            Optional<User> found = userRepository.findByUsername("nonexistent");

            // then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    class existsByUsername_메서드는 {

        @Test
        void 존재하는_아이디면_true를_반환한다() {
            // given
            userRepository.save(User.create("student01", "$2a$10$hashed", Role.STUDENT));

            // when & then
            assertThat(userRepository.existsByUsername("student01")).isTrue();
        }

        @Test
        void 존재하지_않는_아이디면_false를_반환한다() {
            assertThat(userRepository.existsByUsername("nonexistent")).isFalse();
        }
    }
}