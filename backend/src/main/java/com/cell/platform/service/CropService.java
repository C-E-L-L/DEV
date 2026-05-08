package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TrainingDataResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.crop.CropCoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CropService {

    private final CropRepository cropRepository;
    private final CropCoreRepository cropCoreRepository;

    public List<CropResponse> getCropsByTaskId(Long taskId) {
        return cropRepository.findAllByTaskId(taskId).stream()
                .map(CropResponse::from)
                .toList();
    }

    public List<TrainingDataResponse> getConfirmedTrainingData() {
        return cropRepository.findAllByFinalLabelIsNotNull().stream()
                .map(TrainingDataResponse::from)
                .toList();
    }

    @Transactional
    public void confirmLabel(Long cropId, String finalLabel) {
        CellType cellType = parseCellType(finalLabel);
        // Entity를 직접 조회하여 JPA dirty checking으로 업데이트
        CropEntity entity = cropCoreRepository.findEntityById(cropId);
        if (entity == null) {
            throw new NotFoundException("크롭(Crop)을 찾을 수 없습니다. cropId=" + cropId, ErrorCode.C000);
        }
        entity.updateFinalLabel(cellType);
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
