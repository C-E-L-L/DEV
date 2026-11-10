package com.cell.platform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_attempts", uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "student_id"}))
@Getter
@NoArgsConstructor
public class TaskAttemptEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "task_id", nullable = false) private Long taskId;
    @Column(name = "student_id", nullable = false) private String studentId;
    @Column(nullable = false) private LocalDateTime finalizedAt;

    public TaskAttemptEntity(Long taskId, String studentId) {
        this.taskId = taskId; this.studentId = studentId; this.finalizedAt = LocalDateTime.now();
    }
}
