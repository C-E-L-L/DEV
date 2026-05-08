package com.cell.platform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes; // 경로 수정됨
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "student_confusion_matrix")
@Getter
@Setter
public class StudentConfusionMatrixEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Service의 매개변수 타입에 맞춰 String으로 수정
    @Column(name = "student_id", nullable = false)
    private String studentId;

    // Service의 매개변수 타입에 맞춰 Long으로 수정
    @Column(name = "task_id", nullable = false)
    private Long taskId;

    // 핵심: JSON 컬럼 맵핑
    // 구조: { "ActualLabel": { "PredictedLabel": count, ... }, ... }
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "matrix_data", columnDefinition = "json")
    private Map<String, Map<String, Integer>> matrixData;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // 데이터가 업데이트(merge) 될 때마다 갱신 시간을 자동으로 최신화합니다.
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}