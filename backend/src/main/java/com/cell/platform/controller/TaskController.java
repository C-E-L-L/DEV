package com.cell.platform.controller;

import com.cell.platform.dto.request.DiagnosticTaskCreateRequest;
import com.cell.platform.dto.request.DeadlineUpdateRequest;
import com.cell.platform.dto.response.DiagnosticPoolStatsResponse;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.dto.response.TaskUploadResponse;
// [추가된 Import]
import com.cell.platform.dto.response.DiagnosticStudentMatrixResponse;
import com.cell.platform.service.DiagnosticTaskService;
import com.cell.platform.service.TaskService;
// [추가된 Import]
import com.cell.platform.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
// [추가된 Import] 교수님 권한 체크용
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final DiagnosticTaskService diagnosticTaskService;

    // [추가된 부분] SubmissionService 주입
    private final SubmissionService submissionService;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @PostMapping("/upload")
    public ResponseEntity<TaskUploadResponse> uploadAndCreateTask(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "deadlineAt", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime deadlineAt) {
        return ResponseEntity.ok(taskService.createTask(file, deadlineAt));
    }

    @GetMapping("/diagnostic/pool-stats")
    public ResponseEntity<DiagnosticPoolStatsResponse> getDiagnosticPoolStats() {
        return ResponseEntity.ok(diagnosticTaskService.getPoolStats());
    }

    @PostMapping("/diagnostic/create")
    public ResponseEntity<TaskUploadResponse> createDiagnosticTask(
            @Valid @RequestBody DiagnosticTaskCreateRequest request) {
        return ResponseEntity.ok(diagnosticTaskService.createDiagnosticTask(request));
    }

    @GetMapping("/diagnostic/student-matrices")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<DiagnosticStudentMatrixResponse> getCumulativeStudentMatrices() {
        return ResponseEntity.ok(submissionService.getCumulativeStudentMatrices());
    }

    // [추가된 부분] 교수님용: 특정 과제의 모든 학생 혼동행렬 조회 API
    @GetMapping("/{taskId}/diagnostic/student-matrices")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<DiagnosticStudentMatrixResponse> getStudentMatrices(@PathVariable Long taskId) {
        return ResponseEntity.ok(submissionService.getDiagnosticStudentMatrices(taskId));
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{taskId}/deadline")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<Void> updateDeadline(
            @PathVariable Long taskId,
            @RequestBody DeadlineUpdateRequest request) {
        taskService.updateTaskDeadline(taskId, request.deadlineAt());
        return ResponseEntity.ok().build();
    }
}
