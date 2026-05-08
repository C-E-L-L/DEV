package com.cell.platform.controller;

import com.cell.platform.dto.response.CropStatsResponse;
import com.cell.platform.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/tasks/{taskId}/stats")
    public ResponseEntity<List<CropStatsResponse>> getTaskStats(@PathVariable Long taskId) {
        return ResponseEntity.ok(statsService.getTaskStats(taskId));
    }

    @GetMapping("/all-stats")
    public ResponseEntity<List<CropStatsResponse>> getAllStats() {
        return ResponseEntity.ok(statsService.getAllStats());
    }
}
