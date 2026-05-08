package com.cell.platform.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class AiAnalysisResponse {

    @JsonProperty("total_detected")
    private int totalDetected;

    private List<DetectedCell> cells;

    @Getter
    @NoArgsConstructor
    public static class DetectedCell {
        @JsonProperty("crop_filename")
        private String cropFilename;

        private String bbox;
        private String prediction;
        private Double confidence;
    }
}
