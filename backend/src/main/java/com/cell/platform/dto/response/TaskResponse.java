package com.cell.platform.dto.response;

import com.cell.platform.domain.task.Task;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        String status,
        String originalFilename,
        String uploadedFilename,
        Long assignmentId,
        String title,
        Long speciesId,
        String speciesCode,
        String speciesName,
        LocalDateTime createdAt,
        LocalDateTime deadlineAt,
        int cropCount
) {
    public TaskResponse(Long id, String status, String originalFilename, String uploadedFilename,
                        Long assignmentId, String title, LocalDateTime createdAt,
                        LocalDateTime deadlineAt, int cropCount) {
        this(id, status, originalFilename, uploadedFilename, assignmentId, title,
                null, null, null, createdAt, deadlineAt, cropCount);
    }

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getStatus().name(),
                task.getOriginalFilename(),
                task.getUploadedFilename(),
                task.getAssignmentId(),
                task.getTitle(),
                task.getSpeciesId(),
                task.getSpeciesCode(),
                task.getSpeciesName(),
                task.getCreatedAt(),
                task.getDeadlineAt(),
                task.getCrops().size()
        );
    }
}
