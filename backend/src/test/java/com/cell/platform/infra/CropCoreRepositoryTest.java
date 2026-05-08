package com.cell.platform.infra;

import com.cell.platform.context.RepositoryContext;
import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.infra.crop.CropCoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

class CropCoreRepositoryTest extends RepositoryContext {

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private CropCoreRepository cropCoreRepository;

    @Autowired
    private TaskRepository taskRepository;

    private Task savedTask;

    @BeforeEach
    void setUp() {
        Task task = Task.create("orig.jpg", "blood.jpg");
        Crop crop1 = Crop.create("crop_01.jpg", "[10,20,30,40]", CellType.Lymphocyte, 0.95);
        Crop crop2 = Crop.create("crop_02.jpg", "[50,60,70,80]", CellType.Band, 0.7);
        task.getCrops().add(crop1);
        task.getCrops().add(crop2);
        savedTask = taskRepository.save(task);
    }

    @Nested
    class save_메서드는 {

        @Test
        void 크롭을_저장하고_ID를_부여한다() {
            // given
            Long taskId = savedTask.getId();
            Crop crop = Crop.builder()
                    .taskId(taskId)
                    .cropFilename("crop_new.jpg")
                    .bbox("[100,200,300,400]")
                    .aiPrediction(CellType.Monocyte)
                    .aiConfidence(0.88)
                    .build();

            // when
            Crop saved = cropRepository.save(crop);

            // then
            assertAll(
                    () -> assertThat(saved.getId()).isNotNull(),
                    () -> assertThat(saved.getTaskId()).isEqualTo(taskId),
                    () -> assertThat(saved.getCropFilename()).isEqualTo("crop_new.jpg"),
                    () -> assertThat(saved.getAiPrediction()).isEqualTo(CellType.Monocyte),
                    () -> assertThat(saved.getAiConfidence()).isEqualTo(0.88)
            );
        }
    }

    @Nested
    class findById_메서드는 {

        @Test
        void 존재하는_크롭을_조회한다() {
            // given
            Long cropId = savedTask.getCrops().get(0).getId();

            // when
            Optional<Crop> found = cropRepository.findById(cropId);

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getCropFilename()).isEqualTo("crop_01.jpg");
        }
    }

    @Nested
    class findAllByTaskId_메서드는 {

        @Test
        void 해당_과제의_크롭만_반환한다() {
            // when
            List<Crop> crops = cropRepository.findAllByTaskId(savedTask.getId());

            // then
            assertThat(crops).hasSize(2);
        }
    }

    @Nested
    class findAllByFinalLabelIsNotNull_메서드는 {

        @Test
        void 확정된_크롭만_반환한다() {
            // given
            CropEntity entity = cropCoreRepository.findEntityById(savedTask.getCrops().get(0).getId());
            entity.updateFinalLabel(CellType.Lymphocyte);
            cropJpaRepository.flush();

            // when
            List<Crop> confirmed = cropRepository.findAllByFinalLabelIsNotNull();

            // then
            assertThat(confirmed).hasSize(1);
            assertThat(confirmed.get(0).getFinalLabel()).isEqualTo(CellType.Lymphocyte);
        }

        @Test
        void 확정된_크롭이_없으면_빈_리스트를_반환한다() {
            assertThat(cropRepository.findAllByFinalLabelIsNotNull()).isEmpty();
        }
    }

    @Nested
    class findAll_메서드는 {

        @Test
        void 전체_크롭을_반환한다() {
            assertThat(cropRepository.findAll()).hasSize(2);
        }
    }

    @Nested
    class findEntityById_메서드는 {

        @Test
        void 존재하는_크롭_엔티티를_반환한다() {
            // given
            Long cropId = savedTask.getCrops().get(0).getId();

            // when
            CropEntity entity = cropCoreRepository.findEntityById(cropId);

            // then
            assertAll(
                    () -> assertThat(entity).isNotNull(),
                    () -> assertThat(entity.getCropFilename()).isEqualTo("crop_01.jpg")
            );
        }

        @Test
        void 존재하지_않는_크롭이면_null을_반환한다() {
            assertThat(cropCoreRepository.findEntityById(999L)).isNull();
        }
    }
}