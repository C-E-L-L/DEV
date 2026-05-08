package com.cell.platform.controller;

import com.cell.platform.dto.request.SubmissionRequest;
import com.cell.platform.dto.response.MyResultsResponse;
import com.cell.platform.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping("/submit")
    public ResponseEntity<Void> submit(@RequestBody SubmissionRequest request) {
        submissionService.submit(request.cropId(), request.studentId(), request.studentLabel());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tasks/{taskId}/submissions/{studentId}")
    public ResponseEntity<List<Long>> getSolvedCrops(
            @PathVariable Long taskId,
            @PathVariable String studentId) {
        return ResponseEntity.ok(submissionService.getSolvedCropIds(taskId, studentId));
    }

    @GetMapping("/tasks/{taskId}/my-results/{studentId}")
    public ResponseEntity<MyResultsResponse> getMyResults(
            @PathVariable Long taskId,
            @PathVariable String studentId) {
        return ResponseEntity.ok(submissionService.getMyResults(taskId, studentId));
    }
}
