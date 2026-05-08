package com.cell.platform.controller;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.config.SecurityConfig;
import com.cell.platform.dto.response.MyResultsResponse;
import com.cell.platform.service.SubmissionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SubmissionController.class)
@Import(SecurityConfig.class)
class SubmissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SubmissionService submissionService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Nested
    class 답안_제출_API는 {

        @Test
        @WithMockUser(roles = "STUDENT")
        void 정상_요청이면_200을_반환한다() throws Exception {
            // given
            doNothing().when(submissionService).submit(any(), any(), any());
            Map<String, Object> request = Map.of(
                    "cropId", 1,
                    "studentId", "student01",
                    "studentLabel", "Lymphocyte"
            );

            // when & then
            mockMvc.perform(post("/api/submit")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        void 인증되지_않은_사용자는_401을_반환한다() throws Exception {
            // given
            Map<String, Object> request = Map.of(
                    "cropId", 1,
                    "studentId", "student01",
                    "studentLabel", "Lymphocyte"
            );

            // when & then
            mockMvc.perform(post("/api/submit")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class 풀이_이력_조회_API는 {

        @Test
        @WithMockUser(roles = "STUDENT")
        void 풀이한_크롭_ID_목록을_반환한다() throws Exception {
            // given
            given(submissionService.getSolvedCropIds(1L, "student01"))
                    .willReturn(List.of(1L, 2L, 3L));

            // when & then
            mockMvc.perform(get("/api/tasks/1/submissions/student01"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(3));
        }
    }

    @Nested
    class 내_결과_조회_API는 {

        @Test
        @WithMockUser(roles = "STUDENT")
        void 정답률과_상세_결과를_반환한다() throws Exception {
            // given
            MyResultsResponse.Detail detail = MyResultsResponse.Detail.builder()
                    .cropId(1L).cropFilename("crop.jpg")
                    .studentLabel("Lymphocyte").aiLabel("Lymphocyte")
                    .isCorrect(true).build();
            MyResultsResponse response = MyResultsResponse.builder()
                    .total(1).correct(1).wrong(0).accuracy(100)
                    .details(List.of(detail)).build();
            given(submissionService.getMyResults(1L, "student01")).willReturn(response);

            // when & then
            mockMvc.perform(get("/api/tasks/1/my-results/student01"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(1))
                    .andExpect(jsonPath("$.accuracy").value(100))
                    .andExpect(jsonPath("$.details[0].isCorrect").value(true));
        }
    }
}