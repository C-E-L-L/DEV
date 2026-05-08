package com.cell.platform.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CropEntityTest {

    @Nested
    class CropEntity는 {

        @Test
        void 빌더로_정상적으로_생성된다() {
            // given
            TaskEntity task = TaskEntity.builder()
                    .id(1L).status(TaskStatus.IN_PROGRESS)
                    .originalFilename("o.jpg").uploadedFilename("u.jpg").build();

            // when
            CropEntity crop = CropEntity.builder()
                    .id(1L).task(task).cropFilename("crop_abc.jpg")
                    .bbox("[10, 20, 30, 40]").aiPrediction(CellType.Lymphocyte)
                    .aiConfidence(0.95).build();

            // then
            assertAll(
                    () -> assertThat(crop.getId()).isEqualTo(1L),
                    () -> assertThat(crop.getTask()).isEqualTo(task),
                    () -> assertThat(crop.getCropFilename()).isEqualTo("crop_abc.jpg"),
                    () -> assertThat(crop.getAiPrediction()).isEqualTo(CellType.Lymphocyte),
                    () -> assertThat(crop.getAiConfidence()).isEqualTo(0.95),
                    () -> assertThat(crop.getFinalLabel()).isNull()
            );
        }
    }

    @Nested
    class updateFinalLabel_메서드는 {

        @Test
        void 최종_라벨을_정상적으로_변경한다() {
            // given
            CropEntity crop = CropEntity.builder()
                    .id(1L).cropFilename("crop.jpg").bbox("[0,0,10,10]")
                    .aiPrediction(CellType.Band).aiConfidence(0.8).build();

            // when
            crop.updateFinalLabel(CellType.Monocyte);

            // then
            assertThat(crop.getFinalLabel()).isEqualTo(CellType.Monocyte);
        }
    }

    @Nested
    class getTaskId_메서드는 {

        @Test
        void Task가_null이면_null을_반환한다() {
            // given
            CropEntity crop = CropEntity.builder()
                    .id(1L).cropFilename("crop.jpg").bbox("[0,0,10,10]")
                    .aiPrediction(CellType.Band).aiConfidence(0.8).build();

            // when & then
            assertThat(crop.getTaskId()).isNull();
        }
    }
}