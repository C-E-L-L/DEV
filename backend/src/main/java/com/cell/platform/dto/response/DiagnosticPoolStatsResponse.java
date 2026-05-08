package com.cell.platform.dto.response;

import java.util.Map;

public record DiagnosticPoolStatsResponse(
        int totalAvailable,
        Map<String, Integer> availableByClass
) {
}
