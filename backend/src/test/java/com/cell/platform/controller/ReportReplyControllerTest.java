package com.cell.platform.controller;

import com.cell.platform.config.*;
import com.cell.platform.dto.request.CropIssueReportRequest;
import com.cell.platform.dto.response.*;
import com.cell.platform.service.CropIssueReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CropIssueReportController.class)
@Import(SecurityConfig.class)
class ReportReplyControllerTest {
    @MockBean private com.cell.platform.infra.task.TaskJpaRepository imageTasks;
    @MockBean private com.cell.platform.infra.crop.CropJpaRepository imageCrops;

    @Autowired MockMvc mvc;
    @MockBean CropIssueReportService service;
    @MockBean JwtTokenProvider jwtTokenProvider;

    @ParameterizedTest
    @ValueSource(strings = {"EXPERT", "ADMIN"})
    void bothStaffRolesCanReply(String role) throws Exception {
        when(service.reply(1L, "teacher", "A helpful reply"))
                .thenReturn(new CropIssueReplyResponse(2L, "teacher", "Teacher", role, "A helpful reply", null));
        mvc.perform(post("/api/reports/1/replies").with(user("teacher").roles(role))
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"A helpful reply\",\"authorUsername\":\"forged\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.authorUsername").value("teacher"));
        verify(service).reply(1L, "teacher", "A helpful reply");
    }

    @Test
    void studentsCanOnlyGetOwnReportsAndCannotReplyOrListOthers() throws Exception {
        when(service.getMyReports("s1")).thenReturn(List.of());
        mvc.perform(get("/api/student/reports?studentId=s2").with(user("s1").roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        verify(service).getMyReports("s1");
        mvc.perform(get("/api/reports").with(user("s1").roles("STUDENT"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/reports/1/replies").with(user("s1").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"forged\"}"))
                .andExpect(status().isForbidden());
        verify(service, never()).reply(anyLong(), anyString(), anyString());
    }

    @Test
    void reportCreationUsesAuthenticatedIdentity() throws Exception {
        mvc.perform(post("/api/reports").with(user("s1").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"taskId\":1,\"cropId\":2,\"studentId\":\"s2\",\"reason\":\"Question\"}"))
                .andExpect(status().isOk());
        verify(service).createReport(new CropIssueReportRequest(1L, 2L, "s2", "Question"), "s1");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void blankRepliesAreRejected(String message) throws Exception {
        mvc.perform(post("/api/reports/1/replies").with(user("teacher").roles("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"" + message + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void oversizedAndMissingInputAreRejected() throws Exception {
        mvc.perform(post("/api/reports/1/replies").with(user("teacher").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"" + "x".repeat(4001) + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/reports").with(user("s1").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\" \"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void anonymousAccessIsRejected() throws Exception {
        mvc.perform(get("/api/student/reports")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/reports/1/replies").contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"reply\"}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }
}
