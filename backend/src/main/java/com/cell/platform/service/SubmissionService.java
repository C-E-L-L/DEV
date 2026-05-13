package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.domain.user.UserRepository;

// 혼동행렬 관련 import
import com.cell.platform.domain.matrix.ConfusionMatrixRepository;
import com.cell.platform.entity.StudentConfusionMatrixEntity;
import com.cell.platform.dto.response.DiagnosticStudentMatrixResponse;

import com.cell.platform.dto.response.MyResultsResponse;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    // 혼동행렬 레포지토리 주입
    private final ConfusionMatrixRepository confusionMatrixRepository;

    @Transactional
    public void submit(Long cropId, String studentId, String studentLabel) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new NotFoundException(
                        "크롭(Crop)을 찾을 수 없습니다. cropId=" + cropId, ErrorCode.S000));
        CellType label = parseCellType(studentLabel);
        Submission submission = Submission.create(crop.getId(), studentId, label);
        submissionRepository.save(submission);

        // 정답(GT) 판별 및 혼동행렬 실시간 업데이트
        String correctLabel = crop.getFinalLabel() != null
                ? crop.getFinalLabel().name()
                : crop.getAiPrediction().name();

        updateConfusionMatrix(studentId, crop.getTaskId(), correctLabel, label.name());
    }

    // --- 여기서부터 원래 주훈님이 가지고 계시던 소중한 코드들 복구 --- //

    public List<Long> getSolvedCropIds(Long taskId, String studentId) {
        List<Crop> crops = cropRepository.findAllByTaskId(taskId);
        List<Long> cropIds = crops.stream().map(Crop::getId).toList();
        return submissionRepository.findAllByCropIdInAndStudentId(cropIds, studentId)
                .stream()
                .map(Submission::getCropId)
                .toList();
    }

    public MyResultsResponse getMyResults(Long taskId, String studentId) {
        List<Crop> crops = cropRepository.findAllByTaskId(taskId);
        List<Long> cropIds = crops.stream().map(Crop::getId).toList();
        Map<Long, Crop> cropMap = crops.stream()
                .collect(Collectors.toMap(Crop::getId, Function.identity()));

        List<Submission> submissions = submissionRepository
                .findAllByCropIdInAndStudentId(cropIds, studentId);

        int correct = 0;
        int wrong = 0;
        List<MyResultsResponse.Detail> details = new ArrayList<>();
        List<String> labels = Arrays.stream(CellType.values())
                .map(Enum::name)
                .toList();
        Map<String, Map<String, Integer>> confusionMatrix = initConfusionMatrix(labels);

        for (Submission sub : submissions) {
            Crop crop = cropMap.get(sub.getCropId());
            if (crop == null) continue;

            String correctLabel = crop.getFinalLabel() != null
                    ? crop.getFinalLabel().name()
                    : crop.getAiPrediction().name();
            boolean isCorrect = sub.getStudentLabel().name().equals(correctLabel);

            if (isCorrect) correct++;
            else wrong++;

            confusionMatrix.get(correctLabel)
                    .compute(sub.getStudentLabel().name(), (key, value) -> value == null ? 1 : value + 1);

            details.add(MyResultsResponse.Detail.builder()
                    .cropId(crop.getId())
                    .cropFilename(crop.getCropFilename())
                    .studentLabel(sub.getStudentLabel().name())
                    .aiLabel(correctLabel)
                    .isCorrect(isCorrect)
                    .build());
        }

        int total = submissions.size();
        int accuracy = total > 0 ? Math.round((float) correct / total * 100) : 0;

        return MyResultsResponse.builder()
                .total(total)
                .correct(correct)
                .wrong(wrong)
                .accuracy(accuracy)
                .details(details)
                .labels(labels)
                .confusionMatrix(confusionMatrix)
                .build();
    }

    private Map<String, Map<String, Integer>> initConfusionMatrix(List<String> labels) {
        Map<String, Map<String, Integer>> matrix = new LinkedHashMap<>();
        for (String actual : labels) {
            Map<String, Integer> row = new LinkedHashMap<>();
            for (String predicted : labels) {
                row.put(predicted, 0);
            }
            matrix.put(actual, row);
        }
        return matrix;
    }

    private CellType parseCellType(String label) {
        try {
            return CellType.valueOf(label);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "유효하지 않은 셀 타입입니다: " + label, ErrorCode.S001);
        }
    }

    // --- 여기서부터 새롭게 추가된 혼동행렬 저장 핵심 로직 --- //

    private void updateConfusionMatrix(String studentId, Long taskId, String actualLabel, String predictedLabel) {
        // 1. 기존 혼동행렬 조회 또는 빈 행렬 새로 생성
        StudentConfusionMatrixEntity matrixEntity = confusionMatrixRepository
                .findByStudentIdAndTaskId(studentId, taskId)
                .orElseGet(() -> {
                    StudentConfusionMatrixEntity newEntity = new StudentConfusionMatrixEntity();
                    newEntity.setStudentId(studentId);
                    newEntity.setTaskId(taskId);
                    newEntity.setMatrixData(new HashMap<>()); // 빈 JSON 맵으로 초기화
                    return newEntity;
                });

        // 2. JSON 데이터(Map) 가져오기
        Map<String, Map<String, Integer>> data = matrixEntity.getMatrixData();
        if (data == null) {
            data = new HashMap<>();
        }

        // 3. 해당 정답(actual)과 학생 예측(predicted)의 카운트 +1
        data.computeIfAbsent(actualLabel, k -> new HashMap<>())
                .merge(predictedLabel, 1, Integer::sum);

        // 4. 다시 세팅 후 DB 저장 (JPA가 JSON 문자열로 자동 변환)
        matrixEntity.setMatrixData(data);
        matrixEntity.setUpdatedAt(LocalDateTime.now());

        confusionMatrixRepository.save(matrixEntity);
    }
    public DiagnosticStudentMatrixResponse getDiagnosticStudentMatrices(Long taskId) {
        // 1. 해당 과제의 모든 학생 혼동행렬 데이터 조회
        List<StudentConfusionMatrixEntity> entities = confusionMatrixRepository.findAllByTaskId(taskId);

        List<DiagnosticStudentMatrixResponse.StudentMatrixDetail> details = entities.stream()
                .map(entity -> {
                    Map<String, Map<String, Integer>> matrix = entity.getMatrixData();

                    // 간단한 통계 계산 (정확도 등)
                    int total = 0;
                    int correct = 0;
                    for (String actual : matrix.keySet()) {
                        for (String predicted : matrix.get(actual).keySet()) {
                            int count = matrix.get(actual).get(predicted);
                            total += count;
                            if (actual.equals(predicted)) correct += count;
                        }
                    }

                    String studentName = resolveStudentName(entity.getStudentId());

                    return DiagnosticStudentMatrixResponse.StudentMatrixDetail.builder()
                            .studentId(entity.getStudentId())
                            .studentName(studentName)
                            .studentDisplayName(buildStudentDisplayName(entity.getStudentId(), studentName))
                            .confusionMatrix(matrix)
                            .totalSolved(total)
                            .accuracy(total > 0 ? (correct * 100 / total) : 0)
                            .build();
                })
                .toList();

        return DiagnosticStudentMatrixResponse.builder()
                .studentMatrices(details)
                .build();
    }

    private String resolveStudentName(String studentId) {
        return userRepository.findByUsername(studentId)
                .map(user -> user.getName())
                .filter(name -> name != null && !name.isBlank())
                .orElse(null);
    }

    private String buildStudentDisplayName(String studentId, String studentName) {
        return studentName == null ? studentId : studentId + "_" + studentName;
    }
}
