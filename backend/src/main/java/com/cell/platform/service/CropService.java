package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TrainingDataResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.crop.CropCoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CropService {

    private final CropRepository cropRepository;
    private final CropCoreRepository cropCoreRepository;
    private final TaskRepository taskRepository;
    private final SubmissionService submissionService;

    public CropService(CropRepository cropRepository,
                       CropCoreRepository cropCoreRepository,
                       TaskRepository taskRepository,
                       @Lazy SubmissionService submissionService) {
        this.cropRepository = cropRepository;
        this.cropCoreRepository = cropCoreRepository;
        this.taskRepository = taskRepository;
        this.submissionService = submissionService;
    }

    public List<CropResponse> getCropsByTaskId(Long taskId) {
        return getCropsByTaskId(taskId, false);
    }

    public List<CropResponse> getCropsByTaskId(Long taskId, boolean studentView) {
        return cropRepository.findAllByTaskId(taskId).stream()
                .map(crop -> studentView ? CropResponse.forStudent(crop) : CropResponse.from(crop))
                .toList();
    }

    public List<CropResponse> getCropsByAssignmentId(Long assignmentId) {
        return getCropsByAssignmentId(assignmentId, false);
    }

    public List<CropResponse> getCropsByAssignmentId(Long assignmentId, boolean studentView) {
        List<Long> taskIds = taskRepository.findByAssignmentId(assignmentId)
                .stream().map(t -> t.getId()).toList();
        return cropRepository.findAllByTaskIdIn(taskIds).stream()
                .map(crop -> studentView ? CropResponse.forStudent(crop) : CropResponse.from(crop))
                .toList();
    }

    public List<TrainingDataResponse> getConfirmedTrainingData() {
        return cropRepository.findAllByFinalLabelIsNotNull().stream()
                .map(TrainingDataResponse::from)
                .toList();
    }

    @Transactional
    public void confirmLabel(Long cropId, String finalLabel) {
        CellType newCellType = parseCellType(finalLabel);
        CropEntity entity = cropCoreRepository.findEntityById(cropId);
        if (entity == null) {
            throw new NotFoundException("크롭(Crop)을 찾을 수 없습니다. cropId=" + cropId, ErrorCode.C000);
        }
        CellType oldFinalLabel = entity.getFinalLabel();
        Long taskId = entity.getTaskId();
        entity.updateFinalLabel(newCellType);
        // 이미 제출된 학생들의 혼동행렬 소급 업데이트
        submissionService.backfillConfusionMatrixForCrop(cropId, taskId, oldFinalLabel, newCellType);
    }

    public Crop findCropById(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "크롭(Crop)을 찾을 수 없습니다. cropId=" + id, ErrorCode.C000));
    }

    private CellType parseCellType(String label) {
        try {
            return CellType.valueOf(label);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "유효하지 않은 셀 타입입니다: " + label, ErrorCode.C001);
        }
    }
}
