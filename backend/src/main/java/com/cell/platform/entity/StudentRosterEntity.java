package com.cell.platform.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_roster")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentRosterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String studentId;

    private String registeredBy;

    private Long claimedUserId;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public StudentRosterEntity(String studentId, String registeredBy) {
        this.studentId = studentId;
        this.registeredBy = registeredBy;
    }

    public void claim(Long userId) {
        this.claimedUserId = userId;
    }
}
