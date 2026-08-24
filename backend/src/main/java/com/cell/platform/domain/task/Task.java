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
    private Long speciesId;
    private String speciesCode;
    private String speciesName;
    private LocalDateTime createdAt;
    private LocalDateTime deadlineAt;
    private List<Crop> crops;

    @Builder
    public Task(Long id, TaskStatus status, String originalFilename,
                String uploadedFilename, Long assignmentId, String title,
                Long speciesId, String speciesCode, String speciesName,
                LocalDateTime createdAt, LocalDateTime deadlineAt, List<Crop> crops) {
        this.id = id;
        this.status = status;
        this.originalFilename = originalFilename;
        this.uploadedFilename = uploadedFilename;
        this.assignmentId = assignmentId;
        this.title = title;
        this.speciesId = speciesId;
        this.speciesCode = speciesCode;
        this.speciesName = speciesName;
        this.createdAt = createdAt;
        this.deadlineAt = deadlineAt;
        this.crops = crops != null ? crops : new ArrayList<>();
    }

    public static Task create(String originalFilename, String uploadedFilename) {
        return create(originalFilename, uploadedFilename, null);
    }

    public static Task create(String originalFilename, String uploadedFilename, LocalDateTime deadlineAt) {
        return create(originalFilename, uploadedFilename, deadlineAt, null, null, null);
    }

    public static Task create(String originalFilename, String uploadedFilename, LocalDateTime deadlineAt,
                              Long speciesId, String speciesCode, String speciesName) {
        return Task.builder()
                .status(TaskStatus.IN_PROGRESS)
                .originalFilename(originalFilename)
                .uploadedFilename(uploadedFilename)
                .speciesId(speciesId)
                .speciesCode(speciesCode)
                .speciesName(speciesName)
                .deadlineAt(deadlineAt)
                .crops(new ArrayList<>())
                .build();
    }

    public static Task createForAssignment(String originalFilename, String uploadedFilename,
                                           Long assignmentId, String title, LocalDateTime deadlineAt) {
        return createForAssignment(originalFilename, uploadedFilename, assignmentId, title, deadlineAt,
                null, null, null);
    }

    public static Task createForAssignment(String originalFilename, String uploadedFilename,
                                           Long assignmentId, String title, LocalDateTime deadlineAt,
                                           Long speciesId, String speciesCode, String speciesName) {
        return Task.builder()
                .status(TaskStatus.IN_PROGRESS)
                .originalFilename(originalFilename)
                .uploadedFilename(uploadedFilename)
                .assignmentId(assignmentId)
                .title(title)
                .speciesId(speciesId)
                .speciesCode(speciesCode)
                .speciesName(speciesName)
                .deadlineAt(deadlineAt)
                .crops(new ArrayList<>())
                .build();
    }
}
