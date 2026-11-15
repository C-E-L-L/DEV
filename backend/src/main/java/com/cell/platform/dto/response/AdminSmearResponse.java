package com.cell.platform.dto.response;

import java.time.LocalDateTime;

public record AdminSmearResponse(
        Long taskId,
        String originalFilename,
        String uploadedFilename,
        Long speciesId,
        String speciesCode,
        String speciesName,
        LocalDateTime createdAt,
        long totalCrops,
        long labeledCrops,
        boolean hasLabel
) {
}
