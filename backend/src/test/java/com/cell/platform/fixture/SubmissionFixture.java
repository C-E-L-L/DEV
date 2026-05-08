package com.cell.platform.fixture;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.SubmissionEntity;

public class SubmissionFixture {

    public static Submission createDomain() {
        return Submission.builder()
                .id(1L)
                .cropId(1L)
                .studentId("student01")
                .studentLabel(CellType.Lymphocyte)
                .build();
    }

    public static SubmissionEntity createEntity(CropEntity crop) {
        return SubmissionEntity.builder()
                .id(1L)
                .crop(crop)
                .studentId("student01")
                .studentLabel(CellType.Lymphocyte)
                .build();
    }
}