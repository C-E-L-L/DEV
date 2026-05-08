package com.cell.platform.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.cell.platform.config.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        String secret = "test-secret-key-must-be-at-least-32-bytes-long!!";
        jwtTokenProvider = new JwtTokenProvider(secret, 24);
    }

    @Nested
    class generateToken_메서드는 {

        @Test
        void JWT_토큰을_생성한다() {
            String token = jwtTokenProvider.generateToken("student01", "STUDENT");
            assertThat(token).isNotBlank();
            assertThat(token.split("\\.")).hasSize(3);
        }
    }

    @Nested
    class getUsername_메서드는 {

        @Test
        void 토큰에서_username을_추출한다() {
            String token = jwtTokenProvider.generateToken("student01", "STUDENT");
            assertThat(jwtTokenProvider.getUsername(token)).isEqualTo("student01");
        }
    }

    @Nested
    class getRole_메서드는 {

        @Test
        void 토큰에서_role을_추출한다() {
            String token = jwtTokenProvider.generateToken("expert01", "EXPERT");
            assertThat(jwtTokenProvider.getRole(token)).isEqualTo("EXPERT");
        }
    }

    @Nested
    class isValid_메서드는 {

        @Test
        void 유효한_토큰이면_true를_반환한다() {
            String token = jwtTokenProvider.generateToken("user", "STUDENT");
            assertThat(jwtTokenProvider.isValid(token)).isTrue();
        }

        @Test
        void 잘못된_토큰이면_false를_반환한다() {
            assertThat(jwtTokenProvider.isValid("invalid.token.here")).isFalse();
        }

        @Test
        void 빈_문자열이면_false를_반환한다() {
            assertThat(jwtTokenProvider.isValid("")).isFalse();
        }

        @Test
        void 다른_시크릿으로_만든_토큰이면_false를_반환한다() {
            JwtTokenProvider other = new JwtTokenProvider(
                    "other-secret-key-must-be-at-least-32-bytes-long!!", 24);
            String token = other.generateToken("user", "STUDENT");
            assertThat(jwtTokenProvider.isValid(token)).isFalse();
        }
    }
}