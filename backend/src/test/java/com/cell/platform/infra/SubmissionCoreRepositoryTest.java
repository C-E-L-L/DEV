package com.cell.platform.infra;

import com.cell.platform.context.RepositoryContext;
import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

class SubmissionCoreRepositoryTest extends RepositoryContext {

    @Autowired
    private SubmissionRepository submissionRepository;

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
        void 제출_답안을_저장하고_ID를_부여한다() {
            // given
            Long cropId = savedTask.getCrops().get(0).getId();
            Submission submission = Submission.create(cropId, "student01", CellType.Lymphocyte);

            // when
            Submission saved = submissionRepository.save(submission);

            // then
            assertAll(
                    () -> assertThat(saved.getId()).isNotNull(),
                    () -> assertThat(saved.getCropId()).isEqualTo(cropId),
                    () -> assertThat(saved.getStudentId()).isEqualTo("student01"),
                    () -> assertThat(saved.getStudentLabel()).isEqualTo(CellType.Lymphocyte),
                    () -> assertThat(saved.getSubmittedAt()).isNotNull()
            );
        }
    }

    @Nested
    class findAllByCropIdIn_메서드는 {

        @Test
        void 크롭_ID_목록에_해당하는_제출을_반환한다() {
            // given
            Long cropId1 = savedTask.getCrops().get(0).getId();
            Long cropId2 = savedTask.getCrops().get(1).getId();
            submissionRepository.save(Submission.create(cropId1, "s1", CellType.Lymphocyte));
            submissionRepository.save(Submission.create(cropId2, "s2", CellType.Band));

            // when
            List<Submission> result = submissionRepository.findAllByCropIdIn(List.of(cropId1, cropId2));

            // then
            assertThat(result).hasSize(2);
        }

        @Test
        void 해당하는_제출이_없으면_빈_리스트를_반환한다() {
            assertThat(submissionRepository.findAllByCropIdIn(List.of(999L))).isEmpty();
        }
    }

    @Nested
    class findAllByCropIdInAndStudentId_메서드는 {

        @Test
        void 특정_학생의_제출만_반환한다() {
            // given
            Long cropId = savedTask.getCrops().get(0).getId();
            submissionRepository.save(Submission.create(cropId, "student01", CellType.Lymphocyte));
            submissionRepository.save(Submission.create(cropId, "student02", CellType.Band));

            // when
            List<Submission> result = submissionRepository
                    .findAllByCropIdInAndStudentId(List.of(cropId), "student01");

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStudentId()).isEqualTo("student01");
        }
    }
}