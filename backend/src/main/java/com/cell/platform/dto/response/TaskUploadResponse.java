package com.cell.platform.dto.response;

import java.util.List;

public record TaskUploadResponse(
        Long taskId,
        String originalImage,
        int totalDetected,
        List<CropResponse> crops
) {
    public static TaskUploadResponse of(Long taskId, String filename, List<CropResponse> crops) {
        return new TaskUploadResponse(taskId, filename, crops.size(), crops);
    }
}
