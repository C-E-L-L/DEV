package com.cell.platform.domain.task;

import com.cell.platform.domain.crop.Crop;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
public class Task {

    private Long id;
    private TaskStatus status;
    private String originalFilename;
    private String uploadedFilename;
    private Long assignmentId;
    private String title;
    private LocalDateTime createdAt;
    private List<Crop> crops;

    @Builder
    public Task(Long id, TaskStatus status, String originalFilename,
                String uploadedFilename, Long assignmentId, String title,
                LocalDateTime createdAt, List<Crop> crops) {
        this.id = id;
        this.status = status;
        this.originalFilename = originalFilename;
        this.uploadedFilename = uploadedFilename;
        this.assignmentId = assignmentId;
        this.title = title;
        this.createdAt = createdAt;
        this.crops = crops != null ? crops : new ArrayList<>();
    }

    public static Task create(String originalFilename, String uploadedFilename) {
        return Task.builder()
                .status(TaskStatus.IN_PROGRESS)
                .originalFilename(originalFilename)
                .uploadedFilename(uploadedFilename)
                .crops(new ArrayList<>())
                .build();
    }

    public static Task createForAssignment(String originalFilename, String uploadedFilename,
                                           Long assignmentId, String title) {
        return Task.builder()
                .status(TaskStatus.IN_PROGRESS)
                .originalFilename(originalFilename)
                .uploadedFilename(uploadedFilename)
                .assignmentId(assignmentId)
                .title(title)
                .crops(new ArrayList<>())
                .build();
    }
}
