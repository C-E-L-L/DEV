package com.cell.platform.entity;

import com.cell.platform.domain.task.TaskStatus;
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

    @Column(nullable = false)
    private String originalFilename;

    @Column
    private String uploadedFilename;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CropEntity> crops = new ArrayList<>();

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    private TaskEntity(Long id, TaskStatus status, String originalFilename,
                       String uploadedFilename, LocalDateTime createdAt) {
        this.id = id;
        this.status = status;
        this.originalFilename = originalFilename;
        this.uploadedFilename = uploadedFilename;
        this.createdAt = createdAt;
    }

    public void addCrop(CropEntity cropEntity) {
        this.crops.add(cropEntity);
        cropEntity.assignTask(this);
    }
}
