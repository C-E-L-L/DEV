package com.cell.platform.domain;

import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskStatus;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TaskTest {

    @Nested
    class Task는 {

        @Test
        void 정상적인_인자가_들어오면_객체가_생성된다() {
            // given
            String originalFilename = "orig_abc.jpg";
            String uploadedFilename = "blood_sample.jpg";

            // when
            Task task = Task.create(originalFilename, uploadedFilename);

            // then
            assertThat(task.getOriginalFilename()).isEqualTo(originalFilename);
            assertThat(task.getUploadedFilename()).isEqualTo(uploadedFilename);
            assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
            assertThat(task.getCrops()).isEmpty();
            assertThat(task.getId()).isNull();
            assertThat(task.getCreatedAt()).isNull();
        }
    }
}