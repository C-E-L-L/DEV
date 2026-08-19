package com.cell.platform.dto.response;

import lombok.Builder;
import java.util.List;
import java.util.Map;

@Builder
public record CropStatsResponse(
        Long taskId,
        Long cropId,
        String filename,
        String originalSmearFilename,
        String bbox,
        String gtLabel,
        String pseudoLabel,
        Double aiBboxConfidence,
        Double aiClassificationConfidence,
        String finalLabel,
        int totalAnswers,
        double errorRate,
        double accuracyRate,
        double hardScore,
        List<String> wrongDetails,
        Map<String, Integer> voteDistribution,
        Map<String, List<VoterDetail>> votersByLabel
) {
    public record VoterDetail(
            String studentId,
            String studentName,
            String studentDisplayName
    ) {
    }
}
