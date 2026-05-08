package com.cell.platform.fixture;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;

public class CropFixture {

    public static Crop createDomain() {
        return Crop.builder()
                .id(1L)
                .taskId(1L)
                .cropFilename("crop_abc.jpg")
                .bbox("[10, 20, 30, 40]")
                .aiPrediction(CellType.Lymphocyte)
                .aiConfidence(0.95)
                .build();
    }

    public static Crop createDomainWithFinalLabel() {
        return Crop.builder()
                .id(1L)
                .taskId(1L)
                .cropFilename("crop_abc.jpg")
                .bbox("[10, 20, 30, 40]")
                .aiPrediction(CellType.Lymphocyte)
                .aiConfidence(0.95)
                .finalLabel(CellType.Lymphocyte)
                .build();
    }

    public static CropEntity createEntity(TaskEntity task) {
        return CropEntity.builder()
                .id(1L)
                .task(task)
                .cropFilename("crop_abc.jpg")
                .bbox("[10, 20, 30, 40]")
                .aiPrediction(CellType.Lymphocyte)
                .aiConfidence(0.95)
                .build();
    }
}