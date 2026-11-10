package com.cell.platform.service;

import com.cell.platform.domain.task.TaskKind;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.dto.request.CourseworkSaveRequest;
import com.cell.platform.dto.response.CourseworkResponse;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.cell.platform.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseworkService {
    private final TaskJpaRepository tasks;
    private final CropService cropService;

    public CourseworkResponse get(Long id) { return response(scope(id)); }

    public List<TaskResponse> data() {
        return tasks.findAllUploadedSmearsOrderByIdDesc().stream()
                .map(Mapper::convertToTask).map(TaskResponse::from).toList();
    }

    @Transactional
    public CourseworkResponse save(Long id, CourseworkSaveRequest request) {
        List<TaskEntity> group = scope(id);
        apply(group, request);
        tasks.flush();
        return response(group);
    }

    @Transactional
    public CourseworkResponse publish(Long id, CourseworkSaveRequest request) {
        List<TaskEntity> group = scope(id);
        apply(group, request);
        if (request.deadlineAt() != null && !request.deadlineAt().isAfter(java.time.LocalDateTime.now())) {
            throw bad("마감일은 현재 시각 이후로 설정해주세요.");
        }
        if (request.resultsAfterDeadline() && request.deadlineAt() == null) {
            throw bad("마감 후 결과 공개를 선택하면 마감일을 설정해야 합니다.");
        }
        long active = group.stream().flatMap(t -> t.getCrops().stream()).filter(c -> !c.isExcluded()).count();
        if (active == 0) throw bad("출제 가능한 세포가 하나 이상 있어야 게시할 수 있습니다.");
        for (TaskEntity task : group) {
            if (task.isRequireLabels() && task.getCrops().stream().anyMatch(c -> !c.isExcluded() && c.getFinalLabel() == null)) {
                throw bad("정답 미확정 문항이 있습니다. 라벨링을 완료하거나 '정답 없이 게시'를 선택해주세요.");
            }
            task.publish();
        }
        tasks.flush();
        return response(group);
    }

    /** Reuse retained image data without modifying the original task, labels or student history. */
    @Transactional
    public CourseworkResponse copy(Long id) {
        TaskEntity source = required(id);
        TaskEntity target = TaskEntity.builder()
                .status(TaskStatus.DRAFT).classLabels(source.getClassLabels()).kind(source.getKind()).title(source.getTitle() + " (복사)")
                .originalFilename(source.getOriginalFilename()).uploadedFilename(source.getUploadedFilename())
                .animalSpecies(source.getAnimalSpecies()).requireLabels(source.isRequireLabels()).build();
        for (CropEntity cell : source.getCrops()) {
            CropEntity copy = Mapper.convertToCropEntity(Mapper.convertToCrop(cell));
            // Build a new identity; source files are immutable and may be shared.
            target.addCrop(CropEntity.builder().cropFilename(copy.getCropFilename()).bbox(copy.getBbox())
                    .gtLabel(copy.getGtLabel()).finalLabel(copy.getFinalLabel()).pseudoLabel(copy.getPseudoLabel())
                    .aiBboxConfidence(copy.getAiBboxConfidence()).aiClassificationConfidence(copy.getAiClassificationConfidence())
                    .excluded(copy.isExcluded()).exclusionReason(copy.getExclusionReason()).build());
        }
        tasks.saveAndFlush(target);
        return response(List.of(target));
    }

    private void apply(List<TaskEntity> group, CourseworkSaveRequest request) {
        if (request.title() == null || request.title().isBlank() || request.title().length() > 200) throw bad("과제 제목을 1~200자로 입력해주세요.");
        Map<Long, CropEntity> cells = new HashMap<>();
        for (TaskEntity task : group) {
            if (task.getStatus() != TaskStatus.DRAFT) throw bad("이미 게시된 과제입니다. 데이터에서 복사하여 새 과제로 준비할 수 있습니다.");
            if (request.revisions() == null || !request.revisions().containsKey(task.getId())
                    || !Objects.equals(request.revisions().get(task.getId()), task.getRevision())) {
                throw new ObjectOptimisticLockingFailureException(TaskEntity.class, task.getId());
            }
            task.getCrops().forEach(c -> cells.put(c.getId(), c));
            task.updatePreparation(request.title().trim(), request.deadlineAt(), request.requireLabels(), request.resultsAfterDeadline());
        }
        Set<Long> seen = new HashSet<>();
        for (CourseworkSaveRequest.CellEdit edit : request.cells()) {
            if (!cells.containsKey(edit.cropId()) || !seen.add(edit.cropId())) throw bad("과제에 속하지 않거나 중복된 세포가 있습니다.");
            cropService.reviewCell(edit.cropId(), edit.label(), edit.excluded(), edit.exclusionReason());
        }
    }

    private TaskEntity required(Long id) {
        return tasks.findById(id).orElseThrow(() -> new NotFoundException("과제를 찾을 수 없습니다.", ErrorCode.T000));
    }

    private List<TaskEntity> scope(Long id) {
        TaskEntity task = required(id);
        return task.getAssignmentId() == null ? List.of(task) : tasks.findAllByAssignmentId(task.getAssignmentId());
    }

    private CourseworkResponse response(List<TaskEntity> group) {
        return new CourseworkResponse(group.get(0).getId(), group.stream().map(t ->
                new CourseworkResponse.PreparedTask(TaskResponse.from(Mapper.convertToTask(t)), t.getCrops().stream()
                        .map(Mapper::convertToCrop).map(CropResponse::from).toList())).toList());
    }

    private BadRequestException bad(String message) { return new BadRequestException(message, ErrorCode.G000); }
}
