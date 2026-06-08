package com.cell.platform.entity;

import com.cell.platform.domain.crop.CellType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SubmissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id", nullable = false)
    private CropEntity crop;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "student_id",
            referencedColumnName = "student_id",
            insertable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_submission_student")
    )
    private StudentRosterEntity student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CellType studentLabel;

    private LocalDateTime submittedAt;

    @PrePersist
    void prePersist() {
        this.submittedAt = LocalDateTime.now();
    }

    @Builder
    private SubmissionEntity(Long id, CropEntity crop, String studentId,
                             CellType studentLabel, LocalDateTime submittedAt) {
        this.id = id;
        this.crop = crop;
        this.studentId = studentId;
        this.studentLabel = studentLabel;
        this.submittedAt = submittedAt;
    }
}
