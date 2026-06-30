package com.cell.platform.controller;

import com.cell.platform.dto.request.SubmissionRequest;
import com.cell.platform.dto.response.MyResultsResponse;
import com.cell.platform.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping("/submit")
    public ResponseEntity<Void> submit(
            @RequestBody SubmissionRequest request,
            @AuthenticationPrincipal String username) {
        submissionService.submit(request.cropId(), username, request.studentLabel());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tasks/{taskId}/submissions/{studentId}")
    public ResponseEntity<List<Long>> getSolvedCrops(
            @PathVariable Long taskId,
            @PathVariable String studentId,
            @AuthenticationPrincipal String username,
            Authentication authentication) {
        return ResponseEntity.ok(submissionService.getSolvedCropIds(taskId,
                resolveStudentId(studentId, username, authentication)));
    }

    @GetMapping("/tasks/{taskId}/my-results/{studentId}")
    public ResponseEntity<MyResultsResponse> getMyResults(
            @PathVariable Long taskId,
            @PathVariable String studentId,
            @AuthenticationPrincipal String username,
            Authentication authentication) {
        return ResponseEntity.ok(submissionService.getMyResults(taskId,
                resolveStudentId(studentId, username, authentication)));
    }

    @GetMapping("/assignments/{assignmentId}/submissions/{studentId}")
    public ResponseEntity<List<Long>> getSolvedCropsForAssignment(
            @PathVariable Long assignmentId,
            @PathVariable String studentId,
            @AuthenticationPrincipal String username,
            Authentication authentication) {
        return ResponseEntity.ok(submissionService.getSolvedCropIdsForAssignment(assignmentId,
                resolveStudentId(studentId, username, authentication)));
    }

    @GetMapping("/assignments/{assignmentId}/my-results/{studentId}")
    public ResponseEntity<MyResultsResponse> getMyResultsForAssignment(
            @PathVariable Long assignmentId,
            @PathVariable String studentId,
            @AuthenticationPrincipal String username,
            Authentication authentication) {
        return ResponseEntity.ok(submissionService.getMyResultsForAssignment(assignmentId,
                resolveStudentId(studentId, username, authentication)));
    }

    // STUDENT 역할은 자신의 데이터만 접근 가능, EXPERT/ADMIN은 모든 학생 데이터 접근 가능
    private String resolveStudentId(String requestedId, String username, Authentication authentication) {
        boolean isStudent = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
        return isStudent ? username : requestedId;
    }
}
