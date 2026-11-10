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
    private java.util.Map<String,String> classLabels = com.cell.platform.domain.crop.CellType.defaultLabels();

    private TaskKind kind;
    private boolean requireLabels;
    private boolean resultsAfterDeadline;
    private Long revision;
    private LocalDateTime publishedAt;
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
                LocalDateTime createdAt, LocalDateTime deadlineAt, List<Crop> crops,
                TaskKind kind, boolean requireLabels, boolean resultsAfterDeadline,
                Long revision, LocalDateTime publishedAt, java.util.Map<String,String> classLabels) {
        this.classLabels = classLabels == null ? com.cell.platform.domain.crop.CellType.defaultLabels() : new java.util.LinkedHashMap<>(classLabels);
        this.id = id;
        this.status = status;
        this.kind = kind != null ? kind : uploadedFilename != null && uploadedFilename.startsWith("diagnostic-")
                ? TaskKind.DIAGNOSTIC : TaskKind.PRACTICE;
        this.requireLabels = requireLabels;
        this.resultsAfterDeadline = resultsAfterDeadline;
        this.revision = revision;
        this.publishedAt = publishedAt;
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

    public void setClassLabels(java.util.Map<String,String> labels) { this.classLabels = new java.util.LinkedHashMap<>(labels); }

    public boolean isPublished() {
        return status == TaskStatus.IN_PROGRESS || status == TaskStatus.COMPLETED;
    }

    public boolean isDiagnostic() { return kind == TaskKind.DIAGNOSTIC; }

    public void prepareDraft(TaskKind kind, String title) {
        this.status = TaskStatus.DRAFT;
        this.kind = kind;
        this.title = title;
        this.requireLabels = kind == TaskKind.DIAGNOSTIC;
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
