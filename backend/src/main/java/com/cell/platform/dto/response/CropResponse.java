package com.cell.platform.dto.response;

import com.cell.platform.domain.crop.Crop;

public record CropResponse(
        Long id,
        String cropFilename,
        String bbox,
        String aiPrediction,
        Double aiConfidence,
        String finalLabel
) {
    public static CropResponse from(Crop crop) {
        return new CropResponse(
                crop.getId(),
                crop.getCropFilename(),
                crop.getBbox(),
                crop.getAiPrediction().name(),
                crop.getAiConfidence(),
                crop.getFinalLabel() != null ? crop.getFinalLabel().name() : null
        );
    }
}
