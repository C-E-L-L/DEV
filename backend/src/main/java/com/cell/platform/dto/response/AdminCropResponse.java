package com.cell.platform.dto.response;

public record AdminCropResponse(
        Long cropId,
        Long taskId,
        String cropFilename,
        String originalSmearFilename,
        String gtLabel,
        String pseudoLabel,
        String finalLabel,
        boolean hasLabel
) {
}
