package com.cell.platform.fixture;

import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.entity.TaskEntity;

import java.util.ArrayList;

public class TaskFixture {

    public static Task createDomain() {
        return Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .originalFilename("orig_abc.jpg")
                .uploadedFilename("blood_sample.jpg")
                .crops(new ArrayList<>())
                .build();
    }

    public static TaskEntity createEntity() {
        return TaskEntity.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .originalFilename("orig_abc.jpg")
                .uploadedFilename("blood_sample.jpg")
                .build();
    }
}