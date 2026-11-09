package com.cell.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CropIssueReplyRequest(
        @NotBlank @Size(max = 4000) String message
) {}
