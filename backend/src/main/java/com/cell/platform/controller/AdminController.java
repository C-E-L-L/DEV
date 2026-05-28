package com.cell.platform.controller;

import com.cell.platform.dto.response.AdminCropResponse;
import com.cell.platform.dto.response.AdminSmearResponse;
import com.cell.platform.dto.response.AdminUserResponse;
import com.cell.platform.dto.response.RosterImportResponse;
import com.cell.platform.dto.response.StudentRosterResponse;
import com.cell.platform.dto.request.AdminPasswordResetRequest;
import com.cell.platform.dto.request.AdminProfessorRequest;
import com.cell.platform.dto.request.AdminStatusRequest;
import com.cell.platform.dto.request.StudentRosterRequest;
import com.cell.platform.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/smears")
    public ResponseEntity<List<AdminSmearResponse>> getSmears() {
        return ResponseEntity.ok(adminService.getSmears());
    }

    @GetMapping("/crops")
    public ResponseEntity<List<AdminCropResponse>> getCrops() {
        return ResponseEntity.ok(adminService.getCrops());
    }

    @GetMapping("/professors")
    public ResponseEntity<List<AdminUserResponse>> getProfessors() {
        return ResponseEntity.ok(adminService.getProfessors());
    }

    @PostMapping("/professors")
    public ResponseEntity<AdminUserResponse> createProfessor(@Valid @RequestBody AdminProfessorRequest request) {
        return ResponseEntity.ok(adminService.createProfessor(request));
    }

    @PutMapping("/professors/{userId}/password")
    public ResponseEntity<AdminUserResponse> resetProfessorPassword(
            @PathVariable Long userId,
            @Valid @RequestBody AdminPasswordResetRequest request
    ) {
        return ResponseEntity.ok(adminService.resetProfessorPassword(userId, request.password()));
    }

    @PutMapping("/professors/{userId}/status")
    public ResponseEntity<AdminUserResponse> updateProfessorStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminStatusRequest request
    ) {
        return ResponseEntity.ok(adminService.updateProfessorStatus(userId, request));
    }

    @GetMapping("/student-roster")
    public ResponseEntity<List<StudentRosterResponse>> getStudentRoster() {
        return ResponseEntity.ok(adminService.getStudentRoster());
    }

    @PostMapping("/student-roster")
    public ResponseEntity<RosterImportResponse> addStudentRoster(
            @RequestBody StudentRosterRequest request,
            Authentication authentication
    ) {
        String adminUsername = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(adminService.addStudentRoster(request, adminUsername));
    }

    @GetMapping("/student-signups")
    public ResponseEntity<List<AdminUserResponse>> getStudentSignupRequests(
            @RequestParam(defaultValue = "PENDING") String status
    ) {
        return ResponseEntity.ok(adminService.getStudentSignupRequests(status));
    }

    @GetMapping("/students")
    public ResponseEntity<List<AdminUserResponse>> getStudents(
            @RequestParam(defaultValue = "ALL") String status
    ) {
        return ResponseEntity.ok(adminService.getStudents(status));
    }

    @PutMapping("/students/{userId}/status")
    public ResponseEntity<AdminUserResponse> updateStudentStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminStatusRequest request
    ) {
        return ResponseEntity.ok(adminService.updateStudentStatus(userId, request));
    }

    @PutMapping("/student-signups/{userId}/approve")
    public ResponseEntity<AdminUserResponse> approveStudent(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        String adminUsername = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(adminService.approveStudent(userId, adminUsername));
    }

    @PutMapping("/student-signups/{userId}/reject")
    public ResponseEntity<AdminUserResponse> rejectStudent(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.rejectStudent(userId));
    }
}
