package com.cell.platform.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record StudentReviewResponse(
        List<ReviewGroup> reviews
) {
    public record ReviewGroup(
            String scopeType,
            Long scopeId,
            String title,
            String thumbnailFilename,
            LocalDateTime deadlineAt,
            String availabilityReason,
            int totalCells,
            int answeredCells,
            int unsubmittedCells,
            int gradedAnswers,
            int pendingAnswers,
            int correct,
            int wrong,
            Integer accuracy,
            List<ReviewCell> cells
    ) {
    }

    public record ReviewCell(
            Long taskId,
            Long cropId,
            String cropFilename,
            String originalSmearFilename,
            String bbox,
            String studentLabel,
            String correctLabel,
            Boolean isCorrect
    ) {
    }
}
