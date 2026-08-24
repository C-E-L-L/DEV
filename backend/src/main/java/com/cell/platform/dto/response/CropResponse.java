package com.cell.platform.dto.response;

import com.cell.platform.domain.crop.Crop;

public record CropResponse(
        Long id,
        Long taskId,
        String cropFilename,
        String bbox,
        String gtLabel,
        String pseudoLabel,
        String finalLabel,
        Double aiBboxConfidence,
        Double aiClassificationConfidence,
        String originalSmearFilename,
        Long speciesId,
        String speciesCode,
        String speciesName
) {
    public CropResponse(Long id, Long taskId, String cropFilename, String bbox,
                        String gtLabel, String pseudoLabel, String finalLabel,
                        Double aiBboxConfidence, Double aiClassificationConfidence,
                        String originalSmearFilename) {
        this(id, taskId, cropFilename, bbox, gtLabel, pseudoLabel, finalLabel,
                aiBboxConfidence, aiClassificationConfidence, originalSmearFilename,
                null, null, null);
    }

    public static CropResponse from(Crop crop) {
        return new CropResponse(
                crop.getId(), crop.getTaskId(), crop.getCropFilename(), crop.getBbox(),
                crop.getGtLabel() != null ? crop.getGtLabel().name() : null,
                crop.getPseudoLabel() != null ? crop.getPseudoLabel().name() : null,
                crop.getFinalLabel() != null ? crop.getFinalLabel().name() : null,
                crop.getAiBboxConfidence(), crop.getAiClassificationConfidence(),
                crop.getOriginalSmearFilename(), crop.getSpeciesId(), crop.getSpeciesCode(), crop.getSpeciesName()
        );
    }

    public static CropResponse forStudent(Crop crop) {
        return new CropResponse(
                crop.getId(), crop.getTaskId(), crop.getCropFilename(), crop.getBbox(),
                null, null, null, null, null,
                crop.getOriginalSmearFilename(), crop.getSpeciesId(), crop.getSpeciesCode(), crop.getSpeciesName()
        );
    }
}
