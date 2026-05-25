package com.cell.platform.dto.request;

import java.util.List;

public record LabelingImportRequest(
        Long taskId,
        List<CellLabel> cells
) {
    public record CellLabel(
            Long cropId,
            String gtLabel,
            String finalLabel
    ) {
    }
}
