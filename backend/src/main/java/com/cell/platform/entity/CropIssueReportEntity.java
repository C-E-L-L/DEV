package com.cell.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "crop_issue_reports")
@Getter
@Setter
public class CropIssueReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "crop_id", nullable = false)
    private Long cropId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "student_id",
            referencedColumnName = "student_id",
            insertable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_crop_issue_student")
    )
    private StudentRosterEntity student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "task_id",
            insertable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_crop_issue_task")
    )
    private TaskEntity task;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "crop_id",
            insertable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_crop_issue_crop")
    )
    private CropEntity crop;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
