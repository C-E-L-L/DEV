package com.cell.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class GameRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_name", nullable = false, length = 50)
    private String playerName;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false, length = 10)
    private String mode;

    @Column(name = "played_at", nullable = false)
    private LocalDateTime playedAt;
}
