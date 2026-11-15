package com.cell.platform.controller;

import com.cell.platform.dto.request.ConfirmRequest;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TrainingDataResponse;
import com.cell.platform.service.CropService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CropController {

    private final CropService cropService;

    @GetMapping("/tasks/{taskId}/crops")
    public ResponseEntity<List<CropResponse>> getCropsByTask(
            @PathVariable Long taskId,
            Authentication authentication) {
        return ResponseEntity.ok(cropService.getCropsByTaskId(taskId, isStudent(authentication)));
    }

    @GetMapping("/assignments/{assignmentId}/crops")
    public ResponseEntity<List<CropResponse>> getCropsByAssignment(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        return ResponseEntity.ok(cropService.getCropsByAssignmentId(assignmentId, isStudent(authentication)));
    }

    @PutMapping("/crops/{cropId}/confirm")
    public ResponseEntity<Void> confirmLabel(
            @PathVariable Long cropId,
            @RequestBody ConfirmRequest request) {
        cropService.confirmLabel(cropId, request.finalLabel());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/training-data")
    public ResponseEntity<List<TrainingDataResponse>> getTrainingData() {
        return ResponseEntity.ok(cropService.getConfirmedTrainingData());
    }

    private boolean isStudent(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_STUDENT"));
    }
}
