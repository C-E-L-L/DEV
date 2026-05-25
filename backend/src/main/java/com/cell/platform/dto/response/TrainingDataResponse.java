package com.cell.platform.dto.response;

import com.cell.platform.domain.crop.Crop;

public record TrainingDataResponse(
        Long cropId,
        String cropFilename,
    String label
) {
    public static TrainingDataResponse from(Crop crop) {
        return new TrainingDataResponse(
                crop.getId(),
                crop.getCropFilename(),
        crop.getFinalLabel().name()
        );
    }
}
