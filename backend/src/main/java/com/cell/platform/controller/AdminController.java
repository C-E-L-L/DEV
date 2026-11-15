package com.cell.platform.controller;

import com.cell.platform.dto.request.AdminStatusRequest;
import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.request.StudentRosterRequest;
import com.cell.platform.dto.response.AdminCropResponse;
import com.cell.platform.dto.response.AdminSmearResponse;
import com.cell.platform.dto.response.RosterImportResponse;
import com.cell.platform.dto.response.StudentRosterResponse;
import com.cell.platform.dto.response.UserResponse;
import com.cell.platform.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<Void> createUser(@RequestBody RegisterRequest request) {
        adminService.createUser(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{username}")
    public ResponseEntity<Void> deleteUser(@PathVariable String username) {
        adminService.deleteUser(username);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminStatusRequest request
    ) {
        return ResponseEntity.ok(adminService.updateUserStatus(userId, request));
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
}
