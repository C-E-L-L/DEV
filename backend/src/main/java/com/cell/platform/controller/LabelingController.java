package com.cell.platform.controller;

import com.cell.platform.service.LabelingService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/labeling/tasks")
@RequiredArgsConstructor
public class LabelingController {

    private final LabelingService labelingService;

    @GetMapping("/{taskId}/export")
    public ResponseEntity<byte[]> exportTask(@PathVariable Long taskId) {
        byte[] zip = labelingService.exportTask(taskId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + labelingService.buildArchiveFilename(taskId) + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zip);
    }

    public record ExportRequest(List<Long> taskIds) {}

    /** Several smears in one archive (data page: export selected). */
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportTasks(@RequestBody ExportRequest request) {
        byte[] zip = labelingService.exportTasks(request.taskIds());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cell_labeling_export.zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zip);
    }

    @PostMapping("/{taskId}/import")
    public ResponseEntity<Map<String, Integer>> importLabels(
            @PathVariable Long taskId,
            @RequestBody JsonNode viaJson
    ) {
        int updated = labelingService.importLabels(taskId, viaJson);
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
