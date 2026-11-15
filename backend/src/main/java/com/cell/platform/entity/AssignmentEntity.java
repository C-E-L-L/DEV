package com.cell.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String expertUsername;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { this.createdAt = LocalDateTime.now(); }

    @Builder
    private AssignmentEntity(Long id, String title, String expertUsername, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.expertUsername = expertUsername;
        this.createdAt = createdAt;
    }
}
