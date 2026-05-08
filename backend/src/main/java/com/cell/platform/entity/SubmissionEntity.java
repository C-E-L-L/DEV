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

    @Column(nullable = false)
    private String studentId;

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
