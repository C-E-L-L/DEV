package com.cell.platform.controller;
import com.cell.platform.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final AdminDashboardService service;
    @GetMapping public AdminDashboardService.Dashboard dashboard() { return service.get(); }
}
