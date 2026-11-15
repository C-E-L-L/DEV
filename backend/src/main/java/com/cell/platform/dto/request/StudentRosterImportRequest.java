package com.cell.platform.dto.request;

import java.util.List;

/** Class list rows (학번·성명·분반) parsed from a CSV file by the client. */
public record StudentRosterImportRequest(List<Row> rows) {
    public record Row(String studentId, String name, String section) {}
}
