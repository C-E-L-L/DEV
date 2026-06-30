package com.cell.platform.controller;

import com.cell.platform.dto.response.AssignmentResponse;
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
            @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(
                taskService.createAssignment(title, username, files)
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
}
