package com.cell.platform.controller;

import com.cell.platform.dto.request.CropIssueReportRequest;
import com.cell.platform.dto.response.CropIssueReportResponse;
import com.cell.platform.service.CropIssueReportService;
import com.cell.platform.dto.request.CropIssueReplyRequest;
import com.cell.platform.dto.response.CropIssueReplyResponse;
import jakarta.validation.Valid;
import java.security.Principal;
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
    public ResponseEntity<Void> createReport(@Valid @RequestBody CropIssueReportRequest request, Principal principal) {
        reportService.createReport(request, principal.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<List<CropIssueReportResponse>> getReports() {
        return ResponseEntity.ok(reportService.getReports());
    }

    @GetMapping("/student/reports")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<CropIssueReportResponse>> getMyReports(Principal principal) {
        return ResponseEntity.ok(reportService.getMyReports(principal.getName()));
    }

    @PostMapping("/reports/{reportId}/replies")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<CropIssueReplyResponse> reply(@PathVariable Long reportId,
            @Valid @RequestBody CropIssueReplyRequest request, Principal principal) {
        return ResponseEntity.ok(reportService.reply(reportId, principal.getName(), request.message()));
    }
}
