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

    @Column(name = "student_id", unique = true, nullable = false)
    private String studentId;

    @Column(name = "registered_by")
    private String registeredBy;

    @Column(name = "claimed_user_id")
    private Long claimedUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "registered_by",
            referencedColumnName = "username",
            insertable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_student_roster_registered_by")
    )
    private UserEntity registeredByUser;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "claimed_user_id",
            insertable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_student_roster_claimed_user")
    )
    private UserEntity claimedUser;

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
