package com.cell.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "announcements")
@Getter
@NoArgsConstructor
public class AnnouncementEntity {
    public enum Audience { ALL, STUDENT, EXPERT }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, length=200) private String title;
    @Column(nullable=false, columnDefinition="TEXT") private String body;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Audience audience;
    @Column(nullable=false) private boolean urgent;
    @Column(nullable=false) private String author;
    @Column(nullable=false) private LocalDateTime createdAt;
    @Column(nullable=false) private LocalDateTime updatedAt;

    public AnnouncementEntity(String title, String body, Audience audience, boolean urgent, String author) {
        this.author = author;
        update(title, body, audience, urgent);
        this.createdAt = this.updatedAt;
    }
    public void update(String title, String body, Audience audience, boolean urgent) {
        this.title = title.trim(); this.body = body.trim(); this.audience = audience;
        this.urgent = urgent; this.updatedAt = LocalDateTime.now();
    }
}
