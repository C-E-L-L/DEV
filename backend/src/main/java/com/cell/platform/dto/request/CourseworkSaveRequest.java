package com.cell.platform.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record CourseworkSaveRequest(
        @NotBlank @Size(max = 200) String title,
        LocalDateTime deadlineAt,
        boolean requireLabels,
        boolean resultsAfterDeadline,
        @NotNull Map<Long, Long> revisions,
        @NotNull List<@Valid CellEdit> cells
) {
    public record CellEdit(@NotNull Long cropId, String label, boolean excluded, @Size(max = 500) String exclusionReason) {}
}
