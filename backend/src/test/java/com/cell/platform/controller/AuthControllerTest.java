package com.cell.platform.controller;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.dto.response.LoginResponse;
import com.cell.platform.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Nested
    class 회원가입_API는 {

        @Test
        void 정상_요청이면_200을_반환한다() throws Exception {
            // given
            doNothing().when(authService).register(any());
            Map<String, String> request = Map.of(
                    "username", "student01",
                    "password", "password123",
                    "role", "STUDENT"
            );

            // when & then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        void username이_빈값이면_400을_반환한다() throws Exception {
            // given
            Map<String, String> request = Map.of(
                    "username", "",
                    "password", "password123",
                    "role", "STUDENT"
            );

            // when & then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class 로그인_API는 {

        @Test
        void 정상_요청이면_토큰을_반환한다() throws Exception {
            // given
            LoginResponse loginResponse = LoginResponse.of("jwt-token", "STUDENT", "student01");
            given(authService.login(any())).willReturn(loginResponse);
            Map<String, String> request = Map.of(
                    "username", "student01",
                    "password", "password123"
            );

            // when & then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("jwt-token"))
                    .andExpect(jsonPath("$.tokenType").value("bearer"))
                    .andExpect(jsonPath("$.role").value("STUDENT"))
                    .andExpect(jsonPath("$.username").value("student01"));
        }
    }
}