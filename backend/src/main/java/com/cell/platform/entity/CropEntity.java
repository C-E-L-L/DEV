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

    @Column(nullable = false)
    private boolean excluded;

    @Column(length = 500)
    private String exclusionReason;

    @Convert(converter = CellTypeConverter.class)
    @Column(name = "gt_label")
    private CellType gtLabel;

    @Convert(converter = CellTypeConverter.class)
    @Column(name = "pseudo_label")
    private CellType pseudoLabel;

    @Column(name = "ai_bbox_confidence")
    private Double aiBboxConfidence;

    @Column(name = "ai_classification_confidence")
    private Double aiClassificationConfidence;

    @Convert(converter = CellTypeConverter.class)
    private CellType finalLabel;

    @Builder
    private CropEntity(Long id, TaskEntity task, String cropFilename, String bbox,
                       CellType gtLabel, CellType pseudoLabel,
                       Double aiBboxConfidence, Double aiClassificationConfidence,
                       CellType finalLabel, boolean excluded, String exclusionReason) {
        this.id = id;
        this.task = task;
        this.cropFilename = cropFilename;
        this.bbox = bbox;
        this.excluded = excluded;
        this.exclusionReason = exclusionReason;
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

    public void updateExclusion(boolean excluded, String reason) {
        this.excluded = excluded;
        this.exclusionReason = excluded ? reason : null;
    }
}
