package com.cell.platform.service;

import com.cell.platform.dto.request.GameRecordRequest;
import com.cell.platform.dto.response.GameRecordResponse;
import com.cell.platform.entity.GameRecordEntity;
import com.cell.platform.infra.game.GameRecordJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameRecordService {

    private final GameRecordJpaRepository repo;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd");

    @Transactional
    public void saveRecords(GameRecordRequest request) {
        LocalDateTime now = LocalDateTime.now();
        String mode = request.mode().toUpperCase();
        request.players().stream()
            .filter(p -> p.score() > 0)
            .forEach(p -> repo.save(GameRecordEntity.builder()
                .playerName(p.name())
                .score(p.score())
                .mode(mode)
                .playedAt(now)
                .build()));
    }

    public List<GameRecordResponse> getLeaderboard(String mode) {
        return repo.findTopByMode(mode.toUpperCase(), PageRequest.of(0, 15)).stream()
            .map(e -> new GameRecordResponse(e.getPlayerName(), e.getScore(), e.getPlayedAt().format(DATE_FMT)))
            .toList();
    }

    @Transactional
    public void deleteAll() {
        repo.deleteAll();
    }
}
