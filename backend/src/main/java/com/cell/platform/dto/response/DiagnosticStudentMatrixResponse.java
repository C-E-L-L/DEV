package com.cell.platform.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.util.Map;
import java.util.List;

@Getter
@Builder
public class DiagnosticStudentMatrixResponse {
    private List<StudentMatrixDetail> studentMatrices;

    @Getter
    @Builder
    public static class StudentMatrixDetail {
        private String studentId;
        // matrix_data: { "Actual": { "Predicted": count } }
        private Map<String, Map<String, Integer>> confusionMatrix;
        private int totalSolved;    // 총 푼 문항 수
        private int accuracy;       // 해당 과제에서의 정확도
    }
}