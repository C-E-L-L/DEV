package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.dto.response.DiagnosticStudentMatrixResponse;
import com.cell.platform.entity.TaskAttemptEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.infra.submission.TaskAttemptJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

/** Calibration uses only teacher-confirmed truth and finalized answers. Never AI predictions. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalibrationService {
    private final TaskRepository tasks;
    private final CropRepository crops;
    private final SubmissionRepository submissions;
    private final UserRepository users;
    private final TaskAttemptJpaRepository attempts;
    private final AnimalSpeciesService species;

    public record CalibrationResponse(Long speciesId, String speciesName, String source, String schema,
                                      List<String> labels, List<String> schemas, List<DiagnosticStudentMatrixResponse.StudentMatrixDetail> studentMatrices) {}

    public CalibrationResponse get(Long speciesId, String source, String requestedSchema) {
        var animal = speciesId == null ? species.getDog() : species.getRequired(speciesId);
        if (!Set.of("INITIAL", "DIAGNOSTIC", "ALL").contains(source)) throw new BadRequestException("지원하지 않는 혼동행렬 범위입니다.", ErrorCode.G000);
        var eligible = tasks.findAllByOrderByIdDesc().stream().filter(Task::isPublished)
                .filter(t -> Objects.equals(t.getSpeciesId(), animal.getId()))
                .filter(t -> source.equals("ALL") || t.isDiagnostic()).toList();
        List<String> schemas = eligible.stream().map(t -> schema(t.getClassLabels().keySet())).distinct().toList();
        String selectedSchema = requestedSchema == null || requestedSchema.isBlank() ? (schemas.isEmpty() ? schema(CellType.defaultLabels().keySet()) : schemas.get(0)) : requestedSchema;
        Set<Long> ids = eligible.stream().filter(t -> schema(t.getClassLabels().keySet()).equals(selectedSchema)).map(Task::getId).collect(Collectors.toSet());
        Map<String, List<TaskAttemptEntity>> byStudent = attempts.findAll().stream().filter(a -> ids.contains(a.getTaskId()))
                .sorted(Comparator.comparing(TaskAttemptEntity::getFinalizedAt).thenComparing(TaskAttemptEntity::getTaskId))
                .collect(Collectors.groupingBy(TaskAttemptEntity::getStudentId));
        List<String> labels = List.of(selectedSchema.split("\\|"));
        List<DiagnosticStudentMatrixResponse.StudentMatrixDetail> result = new ArrayList<>();
        for (var user : users.findAllByRole(Role.STUDENT)) {
            List<TaskAttemptEntity> completed = byStudent.getOrDefault(user.getUsername(), List.of());
            List<Long> taskIds = completed.stream().limit(source.equals("INITIAL") ? 1 : Long.MAX_VALUE).map(TaskAttemptEntity::getTaskId).toList();
            Map<Long,Crop> truth = crops.findAllByTaskIdIn(taskIds).stream().filter(c -> !c.isExcluded() && c.getFinalLabel() != null)
                    .collect(Collectors.toMap(Crop::getId, c -> c));
            Map<String,Map<String,Integer>> matrix = new LinkedHashMap<>();
            Map<String,Integer> counts = new LinkedHashMap<>();
            for (String actual : labels) {
                Map<String,Integer> row = new LinkedHashMap<>(); labels.forEach(label -> row.put(label,0));
                matrix.put(actual,row); counts.put(actual,0);
            }
            int total = 0, correct = 0, unknown = 0;
            for (var answer : submissions.findAllByCropIdInAndStudentId(new ArrayList<>(truth.keySet()), user.getUsername())) {
                if (answer.getStudentLabel() == null) { unknown++; continue; }
                String actual = truth.get(answer.getCropId()).getFinalLabel().name(), predicted = answer.getStudentLabel().name();
                matrix.get(actual).merge(predicted,1,Integer::sum); counts.merge(actual,1,Integer::sum);
                total++; if (actual.equals(predicted)) correct++;
            }
            result.add(DiagnosticStudentMatrixResponse.StudentMatrixDetail.builder().studentId(user.getUsername()).studentName(user.getName())
                    .studentDisplayName(user.getName() == null ? user.getUsername() : user.getName() + " (" + user.getUsername() + ")")
                    .confusionMatrix(matrix).totalSolved(total).accuracy(total == 0 ? 0 : correct * 100 / total)
                    .sourceTaskIds(taskIds).sampleCounts(counts).unknownCount(unknown)
                    .missingClasses(counts.entrySet().stream().filter(e -> e.getValue() == 0).map(Map.Entry::getKey).toList()).build());
        }
        return new CalibrationResponse(animal.getId(),animal.getName(),source,selectedSchema,labels,schemas,result);
    }
    private String schema(Set<String> codes) { return codes.stream().sorted().collect(Collectors.joining("|")); }
}
