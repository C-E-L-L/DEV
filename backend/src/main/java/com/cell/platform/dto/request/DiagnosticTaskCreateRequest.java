package com.cell.platform.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.time.LocalDateTime;

public record DiagnosticTaskCreateRequest(
        @NotNull(message = "전체 문제 수는 필수입니다.")
        @Min(value = 1, message = "전체 문제 수는 1 이상이어야 합니다.")
        Integer totalQuestions,

        @NotNull(message = "클래스 분포는 필수입니다.")
        Map<String, Integer> classDistribution,
        Long speciesId,
        String title,
        LocalDateTime deadlineAt
) {
    public DiagnosticTaskCreateRequest(Integer totalQuestions, Map<String, Integer> classDistribution) {
        this(totalQuestions, classDistribution, null, null, null);
    }
}
