package com.cell.platform.entity;

import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.domain.task.TaskKind;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    @Convert(converter = LabelCatalogConverter.class)
    @Column(columnDefinition = "TEXT")
    private java.util.Map<String,String> classLabels = com.cell.platform.domain.crop.CellType.defaultLabels();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskKind kind = TaskKind.PRACTICE;

    @Column(nullable = false)
    private boolean requireLabels;

    @Column(nullable = false)
    private boolean resultsAfterDeadline;

    @Version
    private Long revision;

    private LocalDateTime publishedAt;

    private LocalDateTime preparedAt;

    @Column(nullable = false)
    private String originalFilename;

    @Column
    private String uploadedFilename;

    @Column
    private Long assignmentId;

    @Column
    private String title;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "animal_species_id")
    private AnimalSpeciesEntity animalSpecies;

    private LocalDateTime createdAt;

    private LocalDateTime deadlineAt;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CropEntity> crops = new ArrayList<>();

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    private TaskEntity(Long id, TaskStatus status, String originalFilename,
                       String uploadedFilename, Long assignmentId, String title,
                       AnimalSpeciesEntity animalSpecies,
                       LocalDateTime createdAt, LocalDateTime deadlineAt,
                       TaskKind kind, boolean requireLabels, boolean resultsAfterDeadline,
                       Long revision, LocalDateTime publishedAt, java.util.Map<String,String> classLabels) {
        this.classLabels = classLabels == null ? com.cell.platform.domain.crop.CellType.defaultLabels() : new java.util.LinkedHashMap<>(classLabels);
        this.id = id;
        this.status = status;
        this.kind = kind != null ? kind : uploadedFilename != null && uploadedFilename.startsWith("diagnostic-")
                ? TaskKind.DIAGNOSTIC : TaskKind.PRACTICE;
        this.requireLabels = requireLabels;
        this.resultsAfterDeadline = resultsAfterDeadline;
        this.preparedAt = LocalDateTime.now();
        this.revision = revision;
        this.publishedAt = publishedAt;
        this.originalFilename = originalFilename;
        this.uploadedFilename = uploadedFilename;
        this.assignmentId = assignmentId;
        this.title = title;
        this.animalSpecies = animalSpecies;
        this.createdAt = createdAt;
        this.deadlineAt = deadlineAt;
    }

    public void addCrop(CropEntity cropEntity) {
        this.crops.add(cropEntity);
        cropEntity.assignTask(this);
    }

    public void updateDeadlineAt(LocalDateTime deadlineAt) {
        this.deadlineAt = deadlineAt;
    }

    public void updateAnimalSpecies(AnimalSpeciesEntity animalSpecies) {
        this.animalSpecies = animalSpecies;
    }

    public void setClassLabels(java.util.Map<String,String> labels) { this.classLabels = new java.util.LinkedHashMap<>(labels); }

    public boolean isPublished() {
        return status == TaskStatus.IN_PROGRESS || status == TaskStatus.COMPLETED;
    }

    public void updatePreparation(String title, LocalDateTime deadlineAt,
                                  boolean requireLabels, boolean resultsAfterDeadline) {
        this.title = title;
        this.deadlineAt = deadlineAt;
        this.requireLabels = kind == TaskKind.DIAGNOSTIC || requireLabels;
        this.resultsAfterDeadline = resultsAfterDeadline;
        this.preparedAt = LocalDateTime.now();
    }

    public void publish() {
        status = TaskStatus.IN_PROGRESS;
        publishedAt = LocalDateTime.now();
    }

    public void archive() { status = TaskStatus.ARCHIVED; }
}
