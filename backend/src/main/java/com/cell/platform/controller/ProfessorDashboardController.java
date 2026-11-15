package com.cell.platform.controller;

import com.cell.platform.dto.response.ProfessorActivityResponse;
import com.cell.platform.dto.response.ProfessorProgressResponse;
import com.cell.platform.service.ProfessorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Dashboard summaries. Access is limited to EXPERT/ADMIN by the "/api/professor/**" rule in SecurityConfig. */
@RestController
@RequestMapping("/api/professor")
@RequiredArgsConstructor
public class ProfessorDashboardController {
    private final ProfessorDashboardService service;

    @GetMapping("/progress")
    public ProfessorProgressResponse progress() { return service.getProgress(); }

    @GetMapping("/activity")
    public ProfessorActivityResponse activity(@RequestParam(defaultValue = "30") int limit) { return service.getActivity(limit); }
}
