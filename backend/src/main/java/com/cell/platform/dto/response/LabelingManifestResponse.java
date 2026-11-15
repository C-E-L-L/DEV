package com.cell.platform.dto.response;

import java.util.List;

public record LabelingManifestResponse(
        Long taskId,
        String smearFilename,
        String storedSmearFilename,
        String exportSmearFilename,
        Long speciesId,
        String speciesCode,
        String speciesName,
        List<CellAnnotation> cells
) {
    public record CellAnnotation(
            Long cropId,
            String exportFilename,
            String storedFilename,
            String bbox,
            String gtLabel,
            String finalLabel
    ) {
    }
}
