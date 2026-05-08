package com.cell.platform.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class PseudoLabelService {

    /**
     * TODO:
     * 1) confusion matrix를 확률 행렬로 정규화
     * 2) 학생 투표 분포와 결합해 pseudo label posterior 계산
     * 3) 임계치 기반 확정/보류 정책 적용
     *
     * 현재는 후속 알고리즘 연결을 위한 스캐폴드로, 행 단위 정규화 결과만 반환한다.
     */
    public Map<String, Map<String, Double>> normalizeConfusionMatrix(Map<String, Map<String, Integer>> confusionMatrix) {
        Map<String, Map<String, Double>> normalized = new LinkedHashMap<>();

        for (Map.Entry<String, Map<String, Integer>> rowEntry : confusionMatrix.entrySet()) {
            String actualLabel = rowEntry.getKey();
            Map<String, Integer> row = rowEntry.getValue();
            int rowSum = row.values().stream().mapToInt(Integer::intValue).sum();

            Map<String, Double> normalizedRow = new LinkedHashMap<>();
            for (Map.Entry<String, Integer> cell : row.entrySet()) {
                double value = rowSum == 0 ? 0.0 : (double) cell.getValue() / rowSum;
                normalizedRow.put(cell.getKey(), value);
            }
            normalized.put(actualLabel, normalizedRow);
        }

        return normalized;
    }
}
