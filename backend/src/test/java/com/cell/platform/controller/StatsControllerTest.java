package com.cell.platform.controller;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.config.SecurityConfig;
import com.cell.platform.dto.response.CropStatsResponse;
import com.cell.platform.service.StatsService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StatsController.class)
@Import(SecurityConfig.class)
class StatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StatsService statsService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    private CropStatsResponse createStatsResponse() {
        Map<String, Integer> votes = new LinkedHashMap<>();
        votes.put("Band", 1);
        votes.put("Segment", 0);
        votes.put("Lymphocyte", 3);
        votes.put("Monocyte", 0);
        votes.put("Eosinophil", 0);
        votes.put("NucleatedRBC", 0);

        return CropStatsResponse.builder()
                .taskId(1L).cropId(1L).filename("crop.jpg")
                .bbox("[10,20,30,40]").aiLabel("Lymphocyte").aiConfidence(0.95)
                .finalLabel("Lymphocyte").totalAnswers(4)
                .errorRate(25.0).accuracyRate(75.0).hardScore(30.0)
                .wrongDetails(List.of("Band"))
                .voteDistribution(votes)
                .build();
    }

    @Nested
    class 과제별_통계_API는 {

        @Test
        @WithMockUser(roles = "EXPERT")
        void EXPERT_권한이면_200을_반환한다() throws Exception {
            // given
            given(statsService.getTaskStats(1L)).willReturn(List.of(createStatsResponse()));

            // when & then
            mockMvc.perform(get("/api/tasks/1/stats"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].cropId").value(1))
                    .andExpect(jsonPath("$[0].errorRate").value(25.0))
                    .andExpect(jsonPath("$[0].voteDistribution.Lymphocyte").value(3));
        }
    }

    @Nested
    class 전체_통계_API는 {

        @Test
        @WithMockUser(roles = "EXPERT")
        void EXPERT_권한이면_200을_반환한다() throws Exception {
            // given
            given(statsService.getAllStats()).willReturn(List.of(createStatsResponse()));

            // when & then
            mockMvc.perform(get("/api/all-stats"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].totalAnswers").value(4));
        }

        @Test
        @WithMockUser(roles = "STUDENT")
        void STUDENT_권한이면_403을_반환한다() throws Exception {
            mockMvc.perform(get("/api/all-stats"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void 인증되지_않은_사용자는_401을_반환한다() throws Exception {
            mockMvc.perform(get("/api/all-stats"))
                    .andExpect(status().isUnauthorized());
        }
    }
}