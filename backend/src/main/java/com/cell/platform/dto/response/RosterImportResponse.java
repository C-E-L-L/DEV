package com.cell.platform.dto.response;

public record RosterImportResponse(
        int added,
        int skipped,
        int updated
) {
    public RosterImportResponse(int added, int skipped) {
        this(added, skipped, 0);
    }
}
