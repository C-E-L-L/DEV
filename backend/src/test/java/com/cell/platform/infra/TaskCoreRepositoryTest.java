package com.cell.platform.infra;

import com.cell.platform.context.RepositoryContext;
import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

class TaskCoreRepositoryTest extends RepositoryContext {

    @Autowired
    private TaskRepository taskRepository;

    @Nested
    class save_메서드는 {

        @Test
        void 과제를_저장하고_ID를_부여한다() {
            // given
            Task task = Task.create("orig_abc.jpg", "blood_sample.jpg");

            // when
            Task saved = taskRepository.save(task);

            // then
            assertAll(
                    () -> assertThat(saved.getId()).isNotNull(),
                    () -> assertThat(saved.getOriginalFilename()).isEqualTo("orig_abc.jpg"),
                    () -> assertThat(saved.getUploadedFilename()).isEqualTo("blood_sample.jpg"),
                    () -> assertThat(saved.getCreatedAt()).isNotNull()
            );
        }

        @Test
        void 과제와_크롭을_함께_저장한다() {
            // given
            Task task = Task.create("orig.jpg", "blood.jpg");
            Crop crop = Crop.create("crop_abc.jpg", "[10,20,30,40]", CellType.Lymphocyte, 0.95);
            task.getCrops().add(crop);

            // when
            Task saved = taskRepository.save(task);

            // then
            assertAll(
                    () -> assertThat(saved.getCrops()).hasSize(1),
                    () -> assertThat(saved.getCrops().get(0).getId()).isNotNull(),
                    () -> assertThat(saved.getCrops().get(0).getCropFilename()).isEqualTo("crop_abc.jpg")
            );
        }
    }

    @Nested
    class findById_메서드는 {

        @Test
        void 존재하는_과제를_조회한다() {
            // given
            Task saved = taskRepository.save(Task.create("orig.jpg", "blood.jpg"));

            // when
            Optional<Task> found = taskRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getOriginalFilename()).isEqualTo("orig.jpg");
        }

        @Test
        void 존재하지_않는_과제는_빈값을_반환한다() {
            assertThat(taskRepository.findById(999L)).isEmpty();
        }
    }

    @Nested
    class findAllByOrderByIdDesc_메서드는 {

        @Test
        void ID_내림차순으로_정렬된_과제를_반환한다() {
            // given
            Task first = taskRepository.save(Task.create("first.jpg", "first.jpg"));
            Task second = taskRepository.save(Task.create("second.jpg", "second.jpg"));

            // when
            List<Task> tasks = taskRepository.findAllByOrderByIdDesc();

            // then
            assertThat(tasks).hasSize(2);
            assertThat(tasks.get(0).getId()).isGreaterThan(tasks.get(1).getId());
        }
    }
}