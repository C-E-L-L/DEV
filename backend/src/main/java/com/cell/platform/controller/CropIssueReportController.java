package com.cell.platform.controller;

import com.cell.platform.dto.request.CropIssueReportRequest;
import com.cell.platform.dto.response.CropIssueReportResponse;
import com.cell.platform.service.CropIssueReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CropIssueReportController {

    private final CropIssueReportService reportService;

    @PostMapping("/reports")
    public ResponseEntity<Void> createReport(@RequestBody CropIssueReportRequest request) {
        reportService.createReport(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('EXPERT')")
    public ResponseEntity<List<CropIssueReportResponse>> getReports() {
        return ResponseEntity.ok(reportService.getReports());
    }
}
