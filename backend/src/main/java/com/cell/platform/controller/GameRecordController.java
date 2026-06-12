package com.cell.platform.controller;

import com.cell.platform.dto.request.GameRecordRequest;
import com.cell.platform.dto.response.GameRecordResponse;
import com.cell.platform.service.GameRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameRecordController {

    private final GameRecordService gameRecordService;

    @PostMapping("/records")
    public ResponseEntity<Void> saveRecords(@RequestBody GameRecordRequest request) {
        gameRecordService.saveRecords(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<GameRecordResponse>> getLeaderboard(
            @RequestParam(defaultValue = "EASY") String mode) {
        return ResponseEntity.ok(gameRecordService.getLeaderboard(mode));
    }

    @DeleteMapping("/records")
    public ResponseEntity<Void> deleteAll() {
        gameRecordService.deleteAll();
        return ResponseEntity.ok().build();
    }
}
