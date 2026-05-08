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
    @Column(nullable = false)
    private CellType aiPrediction;

    @Column(nullable = false)
    private Double aiConfidence;

    @Enumerated(EnumType.STRING)
    private CellType finalLabel;

    @Builder
    private CropEntity(Long id, TaskEntity task, String cropFilename, String bbox,
                       CellType aiPrediction, Double aiConfidence, CellType finalLabel) {
        this.id = id;
        this.task = task;
        this.cropFilename = cropFilename;
        this.bbox = bbox;
        this.aiPrediction = aiPrediction;
        this.aiConfidence = aiConfidence;
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
}
