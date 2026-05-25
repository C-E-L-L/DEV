package com.cell.platform.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class DiagnosticStudentMatrixResponse {
    private List<StudentMatrixDetail> studentMatrices;

    @Getter
    @Builder
    public static class StudentMatrixDetail {
        private String studentId;
        private String studentName;
        private String studentDisplayName;
        private Map<String, Map<String, Integer>> confusionMatrix;
        private int totalSolved;
        private int accuracy;
    }
}
