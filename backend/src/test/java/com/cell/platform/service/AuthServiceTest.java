package com.cell.platform.service;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.dto.request.LoginRequest;
import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.response.LoginResponse;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.infra.user.StudentRosterJpaRepository;
import com.cell.platform.service.AuthService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks private AuthService authService;
    @Mock private UserRepository userRepository;
    @Mock private StudentRosterJpaRepository studentRosterJpaRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @Nested
    class register_메서드는 {

        @Test
        void 정상적으로_회원가입한다() {
            given(userRepository.existsByUsername("user")).willReturn(false);
            given(passwordEncoder.encode("pass")).willReturn("$hashed$");
            given(userRepository.save(any(User.class))).willAnswer(i -> i.getArgument(0));

            authService.register(new RegisterRequest("user", "pass", "STUDENT"));

            verify(userRepository).save(any(User.class));
        }

        @Test
        void 중복된_아이디면_예외가_발생한다() {
            given(userRepository.existsByUsername("user")).willReturn(true);

            assertThrows(BadRequestException.class,
                    () -> authService.register(new RegisterRequest("user", "pass", "STUDENT")));
        }
    }

    @Nested
    class login_메서드는 {

        @Test
        void 정상적으로_로그인한다() {
            User user = User.builder()
                    .id(1L).username("user").password("$hashed$").role(Role.STUDENT).build();
            given(userRepository.findByUsername("user")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("pass", "$hashed$")).willReturn(true);
            given(jwtTokenProvider.generateToken("user", "STUDENT")).willReturn("jwt-token");

            LoginResponse response = authService.login(new LoginRequest("user", "pass"));

            assertThat(response.accessToken()).isEqualTo("jwt-token");
            assertThat(response.role()).isEqualTo("STUDENT");
        }

        @Test
        void 아이디가_없으면_예외가_발생한다() {
            given(userRepository.findByUsername("wrong")).willReturn(Optional.empty());

            assertThrows(BadRequestException.class,
                    () -> authService.login(new LoginRequest("wrong", "pass")));
        }

        @Test
        void 비밀번호가_틀리면_예외가_발생한다() {
            User user = User.builder()
                    .id(1L).username("user").password("$hashed$").role(Role.STUDENT).build();
            given(userRepository.findByUsername("user")).willReturn(Optional.of(user));
            given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

            assertThrows(BadRequestException.class,
                    () -> authService.login(new LoginRequest("user", "wrong")));
        }
    }
}