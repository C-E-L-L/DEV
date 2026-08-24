package com.cell.platform.dto.response;

public record AdminCropResponse(
        Long cropId,
        Long taskId,
        String cropFilename,
        String originalSmearFilename,
        Long speciesId,
        String speciesCode,
        String speciesName,
        String gtLabel,
        String pseudoLabel,
        String finalLabel,
        boolean hasLabel
) {
}
