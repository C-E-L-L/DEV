package com.cell.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CropIssueReportRequest(
        @NotNull Long taskId,
        @NotNull Long cropId,
        String studentId,
        @NotBlank @Size(max = 2000) String reason
) {}
