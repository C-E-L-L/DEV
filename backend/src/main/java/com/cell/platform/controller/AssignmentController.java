package com.cell.platform.controller;

import com.cell.platform.dto.response.AssignmentResponse;
import com.cell.platform.dto.request.DeadlineUpdateRequest;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final TaskService taskService;
    private final TaskRepository taskRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<AssignmentResponse> createAssignment(
            @RequestParam("title") String title,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "deadlineAt", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime deadlineAt,
            @RequestParam(value = "speciesIds", required = false) List<Long> speciesIds,
            @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(
                taskService.createAssignment(title, username, files, deadlineAt, speciesIds)
        );
    }

    @GetMapping("/{assignmentId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksForAssignment(@PathVariable Long assignmentId) {
        List<Task> tasks = taskRepository.findByAssignmentId(assignmentId);
        return ResponseEntity.ok(tasks.stream().map(TaskResponse::from).toList());
    }

    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long assignmentId) {
        taskService.deleteAssignment(assignmentId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{assignmentId}/deadline")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<Void> updateDeadline(
            @PathVariable Long assignmentId,
            @RequestBody DeadlineUpdateRequest request) {
        taskService.updateAssignmentDeadline(assignmentId, request.deadlineAt());
        return ResponseEntity.ok().build();
    }

}
