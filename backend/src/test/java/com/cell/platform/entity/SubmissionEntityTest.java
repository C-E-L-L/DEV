package com.cell.platform.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.SubmissionEntity;
import com.cell.platform.entity.TaskEntity;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class SubmissionEntityTest {

    @Nested
    class SubmissionEntity는 {

        @Test
        void 빌더로_정상적으로_생성된다() {
            // given
            TaskEntity task = TaskEntity.builder()
                    .id(1L).status(TaskStatus.IN_PROGRESS)
                    .originalFilename("o.jpg").uploadedFilename("u.jpg").build();
            CropEntity crop = CropEntity.builder()
                    .id(10L).task(task).cropFilename("crop.jpg")
                    .bbox("[0,0,10,10]").aiPrediction(CellType.Band).aiConfidence(0.7).build();

            // when
            SubmissionEntity submission = SubmissionEntity.builder()
                    .id(1L).crop(crop).studentId("student01")
                    .studentLabel(CellType.Lymphocyte).build();

            // then
            assertAll(
                    () -> assertThat(submission.getId()).isEqualTo(1L),
                    () -> assertThat(submission.getCrop().getId()).isEqualTo(10L),
                    () -> assertThat(submission.getStudentId()).isEqualTo("student01"),
                    () -> assertThat(submission.getStudentLabel()).isEqualTo(CellType.Lymphocyte)
            );
        }
    }
}