package com.cell.platform.dto.response;

import lombok.Builder;
import java.util.List;
import java.util.Map;

@Builder
public record MyResultsResponse(
        int total,
        int correct,
        int wrong,
        int accuracy,
        List<Detail> details,
        List<String> labels,
        Map<String, Map<String, Integer>> confusionMatrix
) {
    @Builder
    public record Detail(
            Long cropId,
            String cropFilename,
            String studentLabel,
            String correctLabel,
            Boolean isCorrect
    ) {
    }
}
