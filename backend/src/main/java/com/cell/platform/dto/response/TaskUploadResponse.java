package com.cell.platform.dto.response;

import java.util.List;

public record TaskUploadResponse(
        Long taskId,
        String originalImage,
        Long speciesId,
        String speciesCode,
        String speciesName,
        int totalDetected,
        List<CropResponse> crops
) {
    public static TaskUploadResponse of(Long taskId, String filename, List<CropResponse> crops) {
        return new TaskUploadResponse(taskId, filename, null, null, null, crops.size(), crops);
    }

    public static TaskUploadResponse of(com.cell.platform.domain.task.Task task,
                                        String filename, List<CropResponse> crops) {
        return new TaskUploadResponse(
                task.getId(), filename,
                task.getSpeciesId(), task.getSpeciesCode(), task.getSpeciesName(),
                crops.size(), crops
        );
    }
}
