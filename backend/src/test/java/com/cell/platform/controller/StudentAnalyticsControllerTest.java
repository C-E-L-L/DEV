package com.cell.platform.controller;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.config.SecurityConfig;
import com.cell.platform.dto.response.StudentLearningResponse;
import com.cell.platform.service.StudentAnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentAnalyticsController.class)
@Import(SecurityConfig.class)
class StudentAnalyticsControllerTest {
    @Autowired MockMvc mvc;
    @MockBean StudentAnalyticsService service;
    @MockBean JwtTokenProvider jwtTokenProvider;

    @Test
    @WithMockUser(roles = "EXPERT")
    void professorCanReadStudentHistoryAndTaskDetails() throws Exception {
        when(service.getHistory("s1")).thenReturn(new StudentLearningResponse("s1", List.of()));
        when(service.getTaskDetail("s1", 1L)).thenReturn(new StudentLearningResponse.TaskDetail("s1", null, List.of()));
        mvc.perform(get("/api/analytics/students/s1/history")).andExpect(status().isOk()).andExpect(jsonPath("$.studentId").value("s1"));
        mvc.perform(get("/api/analytics/students/s1/tasks/1")).andExpect(status().isOk()).andExpect(jsonPath("$.cells").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanReadHistory() throws Exception {
        when(service.getHistory("s1")).thenReturn(new StudentLearningResponse("s1", List.of()));
        mvc.perform(get("/api/analytics/students/s1/history")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "s1", roles = "STUDENT")
    void studentsCannotReadEvenTheirOwnUnreleasedAnalytics() throws Exception {
        mvc.perform(get("/api/analytics/students/s1/history")).andExpect(status().isForbidden());
        mvc.perform(get("/api/analytics/students/s2/tasks/1")).andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    @Test
    void anonymousRequestsAreRejected() throws Exception {
        mvc.perform(get("/api/analytics/students/s1/history")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/analytics/students/s1/tasks/1")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }
}
