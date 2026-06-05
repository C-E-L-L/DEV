package com.cell.platform.controller;

import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.response.AdminCropResponse;
import com.cell.platform.dto.response.AdminSmearResponse;
import com.cell.platform.dto.response.UserResponse;
import com.cell.platform.service.AdminService;
import lombok.RequiredArgsConstructor;
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
}
