package com.cell.platform.infra.crop;

import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.cell.platform.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class CropCoreRepository implements CropRepository {

    private final CropJpaRepository cropJpaRepository;
    private final TaskJpaRepository taskJpaRepository;

    @Override
    public Crop save(Crop crop) {
        CropEntity entity = Mapper.convertToCropEntity(crop);
        if (crop.getTaskId() != null) {
            TaskEntity task = taskJpaRepository.findById(crop.getTaskId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Task not found: " + crop.getTaskId()));
            entity.assignTask(task);
        }
        CropEntity saved = cropJpaRepository.save(entity);
        return Mapper.convertToCrop(saved);
    }


    @Override
    public Optional<Crop> findById(Long id) {
        return cropJpaRepository.findById(id).map(Mapper::convertToCrop);
    }

    @Override
    public List<Crop> findAllByTaskId(Long taskId) {
        return cropJpaRepository.findAllByTask_Id(taskId).stream()
                .map(Mapper::convertToCrop)
                .toList();
    }

    @Override
    public List<Crop> findAllByFinalLabelIsNotNull() {
        return cropJpaRepository.findAllByFinalLabelIsNotNull().stream()
                .map(Mapper::convertToCrop)
                .toList();
    }

    @Override
    public List<Crop> findAll() {
        return cropJpaRepository.findAll().stream()
                .map(Mapper::convertToCrop)
                .toList();
    }

    public CropEntity findEntityById(Long id) {
        return cropJpaRepository.findById(id).orElse(null);
    }
}
