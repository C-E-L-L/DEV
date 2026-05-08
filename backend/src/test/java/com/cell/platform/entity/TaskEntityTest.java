package com.cell.platform.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class TaskEntityTest {

    @Nested
    class TaskEntity는 {

        @Test
        void 빌더로_정상적으로_생성된다() {
            // when
            TaskEntity task = TaskEntity.builder()
                    .id(1L).status(TaskStatus.IN_PROGRESS)
                    .originalFilename("orig.jpg").uploadedFilename("uploaded.jpg")
                    .build();

            // then
            assertAll(
                    () -> assertThat(task.getId()).isEqualTo(1L),
                    () -> assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS),
                    () -> assertThat(task.getOriginalFilename()).isEqualTo("orig.jpg"),
                    () -> assertThat(task.getUploadedFilename()).isEqualTo("uploaded.jpg"),
                    () -> assertThat(task.getCrops()).isEmpty()
            );
        }
    }

    @Nested
    class addCrop_메서드는 {

        @Test
        void CropEntity를_추가하고_양방향_관계를_설정한다() {
            // given
            TaskEntity task = TaskEntity.builder()
                    .id(1L).status(TaskStatus.IN_PROGRESS)
                    .originalFilename("orig.jpg").uploadedFilename("uploaded.jpg")
                    .build();
            CropEntity crop = CropEntity.builder()
                    .id(10L).cropFilename("crop.jpg").bbox("[0,0,10,10]")
                    .aiPrediction(CellType.Band).aiConfidence(0.8).build();

            // when
            task.addCrop(crop);

            // then
            assertAll(
                    () -> assertThat(task.getCrops()).hasSize(1),
                    () -> assertThat(task.getCrops().get(0)).isEqualTo(crop),
                    () -> assertThat(crop.getTask()).isEqualTo(task)
            );
        }
    }
}