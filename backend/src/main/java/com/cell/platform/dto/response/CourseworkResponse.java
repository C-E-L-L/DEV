package com.cell.platform.dto.response;

import java.util.List;

public record CourseworkResponse(Long id, List<PreparedTask> tasks) {
    public record PreparedTask(TaskResponse task, List<CropResponse> crops) {}
}
