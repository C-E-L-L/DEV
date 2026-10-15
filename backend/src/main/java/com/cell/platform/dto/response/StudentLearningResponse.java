package com.cell.platform.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record StudentLearningResponse(String studentId, List<Activity> activities) {
    public record Summary(int totalCells, int answeredCells, int correct, int wrong,
                          int pendingAnswers, boolean labelingComplete, Double accuracy) {}

    public record Activity(String scopeType, Long scopeId, String title,
                           LocalDateTime createdAt, LocalDateTime deadlineAt,
                           Summary summary, List<TaskResult> tasks) {}

    public record TaskResult(Long taskId, String title, String filename,
                             String speciesCode, String speciesName, Summary summary) {}

    public record TaskDetail(String studentId, TaskResult task, List<CellResult> cells) {}

    public record CellResult(Long cropId, String cropFilename, String studentLabel,
                             String correctLabel, Boolean isCorrect, LocalDateTime submittedAt) {}
}
