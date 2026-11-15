package com.cell.platform.controller;

import com.cell.platform.config.*;
import com.cell.platform.dto.response.StudentLearningResponse;
import com.cell.platform.dto.response.StudentLearningResponse.*;
import com.cell.platform.service.StudentAnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentHistoryController.class)
@Import(SecurityConfig.class)
class StudentHistoryControllerTest {
    @MockBean private com.cell.platform.infra.task.TaskJpaRepository imageTasks;
    @MockBean private com.cell.platform.infra.crop.CropJpaRepository imageCrops;

    @Autowired MockMvc mvc;
    @MockBean StudentAnalyticsService service;
    @MockBean JwtTokenProvider jwtTokenProvider;

    @Test
    void historyIsOwnAttemptedWorkWithoutUnreleasedGrades() throws Exception {
        var summary = new Summary(2, 1, 1, 0, 0, true, 50.0);
        var task = new TaskResult(1L, "Task", "smear.jpg", "DOG", "Dog", summary);
        when(service.getHistory("s1")).thenReturn(new StudentLearningResponse("s1", List.of(
                new Activity("ASSIGNMENT", 10L, "Assignment", null, null, summary, List.of(task)),
                new Activity("TASK", 2L, "Not started", null, null, new Summary(2, 0, 0, 0, 0, true, 0.0), List.of()))));
        mvc.perform(get("/api/student/history?studentId=s2").with(user("s1").roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activities.length()").value(1))
                .andExpect(jsonPath("$.activities[0].answeredCells").value(1))
                .andExpect(jsonPath("$.activities[0].summary").doesNotExist())
                .andExpect(jsonPath("$.activities[0].accuracy").doesNotExist())
                .andExpect(jsonPath("$.activities[0].tasks[0].summary").doesNotExist());
        verify(service).getHistory("s1");
    }

    @Test
    void answersExposeOnlyOwnSubmittedLabelsNeverCorrectnessOrAnswerKeys() throws Exception {
        when(service.getTaskDetail("s1", 1L)).thenReturn(new TaskDetail("s1", null, List.of(
                new CellResult(1L, "cell.jpg", "Band", "Segment", false, null),
                new CellResult(2L, "other.jpg", null, "Band", null, null))));
        mvc.perform(get("/api/student/history/tasks/1?studentId=s2").with(user("s1").roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].studentLabel").value("Band"))
                .andExpect(jsonPath("$[0].correctLabel").doesNotExist())
                .andExpect(jsonPath("$[0].isCorrect").doesNotExist());
        verify(service).getTaskDetail("s1", 1L);
    }

    @Test
    void onlyStudentSessionsCanUseMyPageEndpoints() throws Exception {
        mvc.perform(get("/api/student/history")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/student/history/tasks/1").with(user("teacher").roles("EXPERT"))).andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }
}
