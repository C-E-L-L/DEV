package com.cell.platform.entity;

import com.cell.platform.domain.crop.CellType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "crops")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CropEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private TaskEntity task;

    @Column(nullable = false)
    private String cropFilename;

    private String bbox;

    @Enumerated(EnumType.STRING)
    @Column(name = "gt_label")
    private CellType gtLabel;

    @Enumerated(EnumType.STRING)
    @Column(name = "pseudo_label")
    private CellType pseudoLabel;

    @Column(name = "ai_bbox_confidence")
    private Double aiBboxConfidence;

    @Column(name = "ai_classification_confidence")
    private Double aiClassificationConfidence;

    @Enumerated(EnumType.STRING)
    private CellType finalLabel;

    @Builder
    private CropEntity(Long id, TaskEntity task, String cropFilename, String bbox,
                       CellType gtLabel, CellType pseudoLabel,
                       Double aiBboxConfidence, Double aiClassificationConfidence,
                       CellType finalLabel) {
        this.id = id;
        this.task = task;
        this.cropFilename = cropFilename;
        this.bbox = bbox;
        this.gtLabel = gtLabel;
        this.pseudoLabel = pseudoLabel;
        this.aiBboxConfidence = aiBboxConfidence;
        this.aiClassificationConfidence = aiClassificationConfidence;
        this.finalLabel = finalLabel;
    }

    public void assignTask(TaskEntity task) {
        this.task = task;
    }

    public Long getTaskId() {
        return task != null ? task.getId() : null;
    }

    public void updateFinalLabel(CellType finalLabel) {
        this.finalLabel = finalLabel;
    }

    public void updateGtLabel(CellType gtLabel) {
        this.gtLabel = gtLabel;
    }

    public void updatePseudoLabel(CellType pseudoLabel) {
        this.pseudoLabel = pseudoLabel;
    }
}
