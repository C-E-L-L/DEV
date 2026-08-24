package com.cell.platform.dto.response;

import java.util.Map;

public record DiagnosticPoolStatsResponse(
        int totalAvailable,
        Map<String, Integer> availableByClass,
        Long speciesId,
        String speciesCode,
        String speciesName
) {
    public DiagnosticPoolStatsResponse(int totalAvailable, Map<String, Integer> availableByClass) {
        this(totalAvailable, availableByClass, null, null, null);
    }
}
