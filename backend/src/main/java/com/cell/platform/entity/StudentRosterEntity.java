package com.cell.platform.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Objects;

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

    /** Optional roster details from a class list (CSV import). The account name is entered at sign-up. */
    @Column(length = 100)
    private String name;

    @Column(length = 50)
    private String section;

    private String registeredBy;

    private Long claimedUserId;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public StudentRosterEntity(String studentId, String registeredBy) {
        this(studentId, registeredBy, null, null);
    }

    public StudentRosterEntity(String studentId, String registeredBy, String name, String section) {
        this.studentId = studentId;
        this.registeredBy = registeredBy;
        this.name = name;
        this.section = section;
    }

    public void claim(Long userId) {
        this.claimedUserId = userId;
    }

    /** Fills in the given details; a null value keeps what is already stored. Returns whether anything changed. */
    public boolean updateProfile(String name, String section) {
        String nextName = name != null ? name : this.name;
        String nextSection = section != null ? section : this.section;
        boolean changed = !Objects.equals(nextName, this.name) || !Objects.equals(nextSection, this.section);
        this.name = nextName;
        this.section = nextSection;
        return changed;
    }
}
