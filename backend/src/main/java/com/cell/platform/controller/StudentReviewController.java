package com.cell.platform.controller;

import com.cell.platform.dto.response.StudentReviewResponse;
import com.cell.platform.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/reviews")
@RequiredArgsConstructor
public class StudentReviewController {

    private final SubmissionService submissionService;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentReviewResponse> getMyReviews(
            @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(submissionService.getStudentReviews(username));
    }
}
