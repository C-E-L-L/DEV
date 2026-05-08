package com.cell.platform.controller;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.config.SecurityConfig;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.dto.response.TaskUploadResponse;
import com.cell.platform.service.DiagnosticTaskService;
import com.cell.platform.service.TaskService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaskService taskService;

    @MockBean
    private DiagnosticTaskService diagnosticTaskService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Nested
    class 과제_목록_조회_API는 {

        @Test
        @WithMockUser(roles = "STUDENT")
        void 인증된_사용자가_요청하면_200을_반환한다() throws Exception {
            // given
            TaskResponse response = new TaskResponse(
                    1L, TaskStatus.IN_PROGRESS.name(),
                    "orig.jpg", "blood.jpg",
                    LocalDateTime.now(), 3
            );
            given(taskService.getAllTasks()).willReturn(List.of(response));

            // when & then
            mockMvc.perform(get("/api/tasks"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].cropCount").value(3));
        }

        @Test
        void 인증되지_않은_사용자는_401을_반환한다() throws Exception {
            mockMvc.perform(get("/api/tasks"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class 이미지_업로드_API는 {

        @Test
        @WithMockUser(roles = "EXPERT")
        void EXPERT_권한이면_200을_반환한다() throws Exception {
            // given
            MockMultipartFile file = new MockMultipartFile(
                    "file", "blood.jpg", "image/jpeg", "test-image".getBytes());
            CropResponse cropResponse = new CropResponse(
                    1L, "crop_abc.jpg", "[10,20,30,40]", "Lymphocyte", 0.95, null);
            TaskUploadResponse response = TaskUploadResponse.of(1L, "orig.jpg", List.of(cropResponse));
            given(taskService.createTask(any())).willReturn(response);

            // when & then
            mockMvc.perform(multipart("/api/tasks/upload").file(file).with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.taskId").value(1))
                    .andExpect(jsonPath("$.totalDetected").value(1));
        }

        @Test
        @WithMockUser(roles = "STUDENT")
        void STUDENT_권한이면_403을_반환한다() throws Exception {
            // given
            MockMultipartFile file = new MockMultipartFile(
                    "file", "blood.jpg", "image/jpeg", "test-image".getBytes());

            // when & then
            mockMvc.perform(multipart("/api/tasks/upload").file(file).with(csrf()))
                    .andExpect(status().isForbidden());
        }
    }
}
