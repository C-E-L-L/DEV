package com.cell.platform.infra.task;

import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class TaskCoreRepository implements TaskRepository {

    private final TaskJpaRepository taskJpaRepository;

    @Override
    public Task save(Task task) {
        TaskEntity entity = Mapper.convertToTaskEntity(task);
        // Task에 포함된 Crop들도 함께 저장
        for (Crop crop : task.getCrops()) {
            CropEntity cropEntity = Mapper.convertToCropEntity(crop);
            entity.addCrop(cropEntity);
        }
        TaskEntity saved = taskJpaRepository.save(entity);
        return Mapper.convertToTask(saved);
    }

    @Override
    public Optional<Task> findById(Long id) {
        return taskJpaRepository.findById(id).map(Mapper::convertToTask);
    }

    @Override
    public List<Task> findAllByOrderByIdDesc() {
        return taskJpaRepository.findAllByOrderByIdDesc().stream()
                .map(Mapper::convertToTask)
                .toList();
    }

    @Override
    public List<Long> findIdsByUploadedFilenameStartingWith(String prefix) {
        return taskJpaRepository.findIdsByUploadedFilenameStartingWith(prefix);
    }

    @Override
    public void deleteById(Long id) {
        taskJpaRepository.deleteById(id);
    }
}
