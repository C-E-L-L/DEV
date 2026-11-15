package com.cell.platform.controller;

import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.request.StudentRosterRequest;
import com.cell.platform.dto.response.RosterImportResponse;
import com.cell.platform.dto.response.StudentRosterResponse;
import com.cell.platform.dto.response.UserResponse;
import com.cell.platform.service.AdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** Student administration only: teachers cannot create or alter privileged accounts. */
@RestController
@RequestMapping("/api/professor/students")
@RequiredArgsConstructor
public class ProfessorStudentController {
    private final AdminService adminService;

    public record StudentAccountRequest(@NotBlank @Size(max=100) String username,
                                        @NotBlank @Size(max=100) String name,
                                        @NotBlank @Size(min=8,max=72) String password) {}

    @GetMapping
    public List<UserResponse> students() {
        return adminService.getUsers().stream().filter(user -> "STUDENT".equals(user.role())).toList();
    }

    @PostMapping
    public void create(@Valid @RequestBody StudentAccountRequest request) {
        adminService.createUser(new RegisterRequest(request.username().trim(), request.name().trim(), request.password(), "STUDENT"));
    }

    @GetMapping("/roster")
    public List<StudentRosterResponse> roster() { return adminService.getStudentRoster(); }

    @PostMapping("/roster")
    public RosterImportResponse register(@RequestBody StudentRosterRequest request, Authentication auth) {
        return adminService.addStudentRoster(request, auth.getName());
    }
}
