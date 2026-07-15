package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
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
import java.util.LinkedHashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionService {

    private static final String DIAGNOSTIC_PREFIX = "diagnostic-";

    private final SubmissionRepository submissionRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final DiagnosticDatasetService diagnosticDatasetService;
    private final ConfusionMatrixRepository confusionMatrixRepository;

    @Transactional
    public void submit(Long cropId, String studentId, String studentLabel) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new NotFoundException(
                        "크롭(Crop)을 찾을 수 없습니다. cropId=" + cropId, ErrorCode.S000));
        CellType newLabel = parseCellType(studentLabel);
        CellType correctLabel = resolveCorrectLabel(crop, isDiagnosticTask(crop.getTaskId()));

        submissionRepository.findByCropIdAndStudentId(cropId, studentId)
                .ifPresentOrElse(
                        existing -> {
                            CellType oldLabel = existing.getStudentLabel();
                            submissionRepository.updateLabel(cropId, studentId, newLabel);
                            if (correctLabel != null) {
                                subtractConfusionMatrixEntry(studentId, crop.getTaskId(),
                                        correctLabel.name(), oldLabel.name());
                                updateConfusionMatrix(studentId, crop.getTaskId(),
                                        correctLabel.name(), newLabel.name());
                            }
                        },
                        () -> {
                            submissionRepository.save(Submission.create(cropId, studentId, newLabel));
                            if (correctLabel != null) {
                                updateConfusionMatrix(studentId, crop.getTaskId(),
                                        correctLabel.name(), newLabel.name());
                            }
                        }
                );
    }

    // --- 여기서부터 원래 주훈님이 가지고 계시던 소중한 코드들 복구 --- //

    public Map<Long, String> getSolvedCropLabels(Long taskId, String studentId) {
        List<Crop> crops = cropRepository.findAllByTaskId(taskId);
        List<Long> cropIds = crops.stream().map(Crop::getId).toList();
        Map<Long, String> result = new LinkedHashMap<>();
        submissionRepository.findAllByCropIdInAndStudentId(cropIds, studentId)
                .forEach(sub -> result.put(sub.getCropId(), sub.getStudentLabel().name()));
        return result;
    }

    public Map<Long, String> getSolvedCropLabelsForAssignment(Long assignmentId, String studentId) {
        List<Task> tasks = taskRepository.findByAssignmentId(assignmentId);
        List<Long> allCropIds = tasks.stream()
                .flatMap(task -> cropRepository.findAllByTaskId(task.getId()).stream())
                .map(Crop::getId)
                .toList();
        Map<Long, String> result = new LinkedHashMap<>();
        submissionRepository.findAllByCropIdInAndStudentId(allCropIds, studentId)
                .forEach(sub -> result.put(sub.getCropId(), sub.getStudentLabel().name()));
        return result;
    }

    public List<Long> getSolvedCropIdsForAssignment(Long assignmentId, String studentId) {
        List<Task> tasks = taskRepository.findByAssignmentId(assignmentId);
        List<Long> allCropIds = tasks.stream()
                .flatMap(task -> cropRepository.findAllByTaskId(task.getId()).stream())
                .map(crop -> crop.getId())
                .toList();
        return submissionRepository.findAllByCropIdInAndStudentId(allCropIds, studentId)
                .stream().map(sub -> sub.getCropId()).toList();
    }

    public MyResultsResponse getMyResultsForAssignment(Long assignmentId, String studentId) {
        List<Task> tasks = taskRepository.findByAssignmentId(assignmentId);
        List<Crop> allCrops = new ArrayList<>();
        for (Task task : tasks) {
            allCrops.addAll(cropRepository.findAllByTaskId(task.getId()));
        }
        List<Long> cropIds = allCrops.stream().map(Crop::getId).toList();
        Map<Long, Crop> cropMap = allCrops.stream()
                .collect(Collectors.toMap(Crop::getId, c -> c));
        List<Submission> submissions = submissionRepository
                .findAllByCropIdInAndStudentId(cropIds, studentId);

        int correct = 0, wrong = 0;
        List<MyResultsResponse.Detail> details = new ArrayList<>();
        List<String> labels = Arrays.stream(CellType.values()).map(Enum::name).toList();
        Map<String, Map<String, Integer>> confusionMatrix = initConfusionMatrix(labels);

        for (Submission sub : submissions) {
            Crop crop = cropMap.get(sub.getCropId());
            if (crop == null) continue;
            CellType resolvedLabel = resolveCorrectLabel(crop, false);
            String correctLabel = resolvedLabel != null ? resolvedLabel.name() : null;
            Boolean isCorrect = null;
            if (correctLabel != null) {
                isCorrect = sub.getStudentLabel().name().equals(correctLabel);
                if (isCorrect) correct++; else wrong++;
                confusionMatrix.get(correctLabel)
                        .compute(sub.getStudentLabel().name(), (k, v) -> v == null ? 1 : v + 1);
            }
            details.add(MyResultsResponse.Detail.builder()
                    .cropId(crop.getId()).cropFilename(crop.getCropFilename())
                    .studentLabel(sub.getStudentLabel().name())
                    .correctLabel(correctLabel).isCorrect(isCorrect).build());
        }

        int total = correct + wrong;
        int accuracy = total > 0 ? Math.round((float) correct / total * 100) : 0;
        return MyResultsResponse.builder().total(total).correct(correct).wrong(wrong)
                .accuracy(accuracy).details(details).labels(labels)
                .confusionMatrix(confusionMatrix).build();
    }

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
        boolean diagnosticTask = isDiagnosticTask(taskId);
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

            CellType resolvedLabel = resolveCorrectLabel(crop, diagnosticTask);
            String correctLabel = resolvedLabel != null ? resolvedLabel.name() : null;
            Boolean isCorrect = null;
            if (correctLabel != null) {
                isCorrect = sub.getStudentLabel().name().equals(correctLabel);
                if (isCorrect) correct++;
                else wrong++;

                confusionMatrix.get(correctLabel)
                        .compute(sub.getStudentLabel().name(), (key, value) -> value == null ? 1 : value + 1);
            }

            details.add(MyResultsResponse.Detail.builder()
                    .cropId(crop.getId())
                    .cropFilename(crop.getCropFilename())
                    .studentLabel(sub.getStudentLabel().name())
                    .correctLabel(correctLabel)
                    .isCorrect(isCorrect)
                    .build());
        }

        int total = correct + wrong;
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

    private boolean isDiagnosticTask(Long taskId) {
        if (taskId == null) {
            return false;
        }
        return taskRepository.findById(taskId)
                .map(task -> task.getUploadedFilename() != null
                        && task.getUploadedFilename().startsWith(DIAGNOSTIC_PREFIX))
                .orElse(false);
    }

    private CellType resolveCorrectLabel(Crop crop, boolean diagnosticTask) {
        if (crop.getFinalLabel() != null) {
            return crop.getFinalLabel();
        }
        if (!diagnosticTask) {
            return null;
        }
        if (crop.getGtLabel() != null) {
            return crop.getGtLabel();
        }
        // Diagnostic tasks created before GT columns were added can still be graded from the manifest.
        return diagnosticDatasetService.findLabelByCropFilename(crop.getCropFilename()).orElse(null);
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

    @Transactional
    public void backfillConfusionMatrixForCrop(Long cropId, Long taskId, CellType oldFinalLabel, CellType newFinalLabel) {
        List<Submission> submissions = submissionRepository.findAllByCropId(cropId);
        for (Submission sub : submissions) {
            String studentId = sub.getStudentId();
            String predicted = sub.getStudentLabel().name();
            if (oldFinalLabel != null) {
                subtractConfusionMatrixEntry(studentId, taskId, oldFinalLabel.name(), predicted);
            }
            updateConfusionMatrix(studentId, taskId, newFinalLabel.name(), predicted);
        }
    }

    private void subtractConfusionMatrixEntry(String studentId, Long taskId, String actualLabel, String predictedLabel) {
        confusionMatrixRepository.findByStudentIdAndTaskId(studentId, taskId).ifPresent(entity -> {
            Map<String, Map<String, Integer>> data = entity.getMatrixData();
            if (data == null) return;
            Map<String, Integer> row = data.get(actualLabel);
            if (row == null) return;
            int current = row.getOrDefault(predictedLabel, 0);
            row.put(predictedLabel, Math.max(0, current - 1));
            entity.setMatrixData(data);
            entity.setUpdatedAt(LocalDateTime.now());
            confusionMatrixRepository.save(entity);
        });
    }

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

    public DiagnosticStudentMatrixResponse getCumulativeStudentMatrices() {
        List<User> students = userRepository.findAllByRole(Role.STUDENT);
        List<String> labels = Arrays.stream(CellType.values())
                .map(Enum::name)
                .toList();

        Map<String, Map<String, Map<String, Integer>>> matrixByStudent = new LinkedHashMap<>();
        Map<String, String> nameByStudent = new HashMap<>();
        Map<String, String> displayByStudent = new HashMap<>();

        for (User student : students) {
            String studentId = student.getUsername();
            String studentName = normalizeStudentName(student.getName());
            matrixByStudent.put(studentId, initConfusionMatrix(labels));
            nameByStudent.put(studentId, studentName);
            displayByStudent.put(studentId, buildStudentDisplayName(studentId, studentName));
        }

        List<Long> eligibleTaskIds = resolveEligibleTaskIds();
        if (!eligibleTaskIds.isEmpty()) {
            List<StudentConfusionMatrixEntity> entities = confusionMatrixRepository
                    .findAllByTaskIdIn(eligibleTaskIds);

            for (StudentConfusionMatrixEntity entity : entities) {
                String studentId = entity.getStudentId();
                matrixByStudent.computeIfAbsent(studentId, id -> initConfusionMatrix(labels));
                if (!nameByStudent.containsKey(studentId)) {
                    String studentName = resolveStudentName(studentId);
                    nameByStudent.put(studentId, studentName);
                    displayByStudent.put(studentId, buildStudentDisplayName(studentId, studentName));
                }
                mergeConfusionMatrix(matrixByStudent.get(studentId), entity.getMatrixData(), labels);
            }
        }

        Map<String, Map<String, Integer>> totalMatrix = initConfusionMatrix(labels);
        for (Map<String, Map<String, Integer>> matrix : matrixByStudent.values()) {
            mergeConfusionMatrix(totalMatrix, matrix, labels);
        }

        List<DiagnosticStudentMatrixResponse.StudentMatrixDetail> details = new ArrayList<>();
        details.add(buildStudentMatrixDetail(
                "ALL",
                null,
                "전체 합계",
                totalMatrix
        ));

        for (Map.Entry<String, Map<String, Map<String, Integer>>> entry : matrixByStudent.entrySet()) {
            String studentId = entry.getKey();
            Map<String, Map<String, Integer>> matrix = entry.getValue();
            details.add(buildStudentMatrixDetail(
                    studentId,
                    nameByStudent.get(studentId),
                    displayByStudent.get(studentId),
                    matrix
            ));
        }

        return DiagnosticStudentMatrixResponse.builder()
                .studentMatrices(details)
                .build();
    }

    private DiagnosticStudentMatrixResponse.StudentMatrixDetail buildStudentMatrixDetail(
            String studentId,
            String studentName,
            String studentDisplayName,
            Map<String, Map<String, Integer>> matrix
    ) {
        int total = 0;
        int correct = 0;
        for (String actual : matrix.keySet()) {
            for (String predicted : matrix.get(actual).keySet()) {
                int count = matrix.get(actual).get(predicted);
                total += count;
                if (actual.equals(predicted)) correct += count;
            }
        }

        return DiagnosticStudentMatrixResponse.StudentMatrixDetail.builder()
                .studentId(studentId)
                .studentName(studentName)
                .studentDisplayName(studentDisplayName)
                .confusionMatrix(matrix)
                .totalSolved(total)
                .accuracy(total > 0 ? (correct * 100 / total) : 0)
                .build();
    }

    private List<Long> resolveEligibleTaskIds() {
        Set<Long> taskIds = new LinkedHashSet<>();
        taskIds.addAll(taskRepository.findIdsByUploadedFilenameStartingWith(DIAGNOSTIC_PREFIX));
        taskIds.addAll(cropRepository.findDistinctTaskIdsByFinalLabelIsNotNull());
        return new ArrayList<>(taskIds);
    }

    private void mergeConfusionMatrix(
            Map<String, Map<String, Integer>> target,
            Map<String, Map<String, Integer>> source,
            List<String> labels
    ) {
        if (source == null) return;
        for (Map.Entry<String, Map<String, Integer>> actualEntry : source.entrySet()) {
            String actual = actualEntry.getKey();
            Map<String, Integer> sourceRow = actualEntry.getValue();
            if (sourceRow == null) continue;

            Map<String, Integer> targetRow = target.computeIfAbsent(actual, key -> initMatrixRow(labels));
            for (Map.Entry<String, Integer> predictedEntry : sourceRow.entrySet()) {
                String predicted = predictedEntry.getKey();
                int count = predictedEntry.getValue() == null ? 0 : predictedEntry.getValue();
                targetRow.merge(predicted, count, Integer::sum);
            }
        }
    }

    private Map<String, Integer> initMatrixRow(List<String> labels) {
        Map<String, Integer> row = new LinkedHashMap<>();
        for (String label : labels) {
            row.put(label, 0);
        }
        return row;
    }

    private String resolveStudentName(String studentId) {
        return userRepository.findByUsername(studentId)
                .map(user -> user.getName())
                .map(this::normalizeStudentName)
                .orElse(null);
    }

    private String normalizeStudentName(String studentName) {
        if (studentName == null || studentName.isBlank()) return null;
        return studentName;
    }

    private String buildStudentDisplayName(String studentId, String studentName) {
        return studentName == null ? studentId : studentId + "_" + studentName;
    }
}
