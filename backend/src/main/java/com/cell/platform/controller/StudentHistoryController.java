package com.cell.platform.controller;

import com.cell.platform.dto.response.StudentHistoryResponse;
import com.cell.platform.service.StudentAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/student/history")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentHistoryController {
    private final StudentAnalyticsService analyticsService;

    @GetMapping
    public StudentHistoryResponse history(Principal principal) {
        return StudentHistoryResponse.from(analyticsService.getHistory(principal.getName()));
    }

    @GetMapping("/tasks/{taskId}")
    public List<StudentHistoryResponse.Answer> answers(@PathVariable Long taskId, Principal principal) {
        return StudentHistoryResponse.answers(analyticsService.getTaskDetail(principal.getName(), taskId));
    }
}
