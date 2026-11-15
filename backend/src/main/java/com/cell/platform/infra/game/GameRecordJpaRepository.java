package com.cell.platform.infra.game;

import com.cell.platform.entity.GameRecordEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameRecordJpaRepository extends JpaRepository<GameRecordEntity, Long> {

    @Query("SELECT g FROM GameRecordEntity g WHERE g.mode = :mode ORDER BY g.score DESC, g.playedAt ASC")
    List<GameRecordEntity> findTopByMode(@Param("mode") String mode, Pageable pageable);
}
