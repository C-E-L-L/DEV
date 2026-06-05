package com.cell.platform.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AssignmentResponse(
        Long assignmentId,
        String title,
        String expertUsername,
        LocalDateTime createdAt,
        List<TaskUploadResponse> tasks,
        int totalCrops,
        int embeddedGtCrops
) {}
