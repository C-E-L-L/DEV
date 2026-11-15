package com.cell.platform.controller;

import com.cell.platform.dto.response.StudentLearningResponse;
import com.cell.platform.service.StudentAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics/students")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
public class StudentAnalyticsController {
    private final StudentAnalyticsService studentAnalyticsService;

    @GetMapping("/{studentId}/history")
    public StudentLearningResponse getHistory(@PathVariable String studentId) {
        return studentAnalyticsService.getHistory(studentId);
    }

    @GetMapping("/{studentId}/tasks/{taskId}")
    public StudentLearningResponse.TaskDetail getTaskDetail(@PathVariable String studentId, @PathVariable Long taskId) {
        return studentAnalyticsService.getTaskDetail(studentId, taskId);
    }
}
