package com.cell.platform.dto.response;

public record RosterImportResponse(
        int added,
        int skipped
) {
}
