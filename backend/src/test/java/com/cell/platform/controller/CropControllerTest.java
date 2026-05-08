package com.cell.platform.controller;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.config.SecurityConfig;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TrainingDataResponse;
import com.cell.platform.service.CropService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CropController.class)
@Import(SecurityConfig.class)
class CropControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CropService cropService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Nested
    class 크롭_목록_조회_API는 {

        @Test
        @WithMockUser(roles = "STUDENT")
        void 인증된_사용자가_요청하면_200을_반환한다() throws Exception {
            // given
            CropResponse response = new CropResponse(
                    1L, "crop.jpg", "[10,20,30,40]", "Lymphocyte", 0.95, null);
            given(cropService.getCropsByTaskId(1L)).willReturn(List.of(response));

            // when & then
            mockMvc.perform(get("/api/tasks/1/crops"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].aiPrediction").value("Lymphocyte"));
        }
    }

    @Nested
    class 정답_확정_API는 {

        @Test
        @WithMockUser(roles = "EXPERT")
        void EXPERT_권한이면_200을_반환한다() throws Exception {
            // given
            doNothing().when(cropService).confirmLabel(eq(1L), eq("Lymphocyte"));
            Map<String, String> request = Map.of("finalLabel", "Lymphocyte");

            // when & then
            mockMvc.perform(put("/api/crops/1/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "STUDENT")
        void STUDENT_권한이면_403을_반환한다() throws Exception {
            // given
            Map<String, String> request = Map.of("finalLabel", "Lymphocyte");

            // when & then
            mockMvc.perform(put("/api/crops/1/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    class 학습_데이터_조회_API는 {

        @Test
        @WithMockUser(roles = "EXPERT")
        void 확정된_데이터_목록을_반환한다() throws Exception {
            // given
            TrainingDataResponse response = new TrainingDataResponse(
                    1L, "crop.jpg", "Lymphocyte", 0.95);
            given(cropService.getConfirmedTrainingData()).willReturn(List.of(response));

            // when & then
            mockMvc.perform(get("/api/training-data"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].cropId").value(1))
                    .andExpect(jsonPath("$[0].label").value("Lymphocyte"));
        }
    }
}