package com.cell.platform.dto.response;

import com.cell.platform.domain.crop.Crop;

public record TrainingDataResponse(
        Long cropId,
        String cropFilename,
        String label,
        Long speciesId,
        String speciesCode,
        String speciesName
) {
    public TrainingDataResponse(Long cropId, String cropFilename, String label) {
        this(cropId, cropFilename, label, null, null, null);
    }

    public static TrainingDataResponse from(Crop crop) {
        return new TrainingDataResponse(
                crop.getId(), crop.getCropFilename(), crop.getFinalLabel().name(),
                crop.getSpeciesId(), crop.getSpeciesCode(), crop.getSpeciesName()
        );
    }
}
