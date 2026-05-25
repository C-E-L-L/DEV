package com.cell.platform.service;

import com.cell.platform.dto.response.AdminCropResponse;
import com.cell.platform.dto.response.AdminSmearResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final TaskJpaRepository taskJpaRepository;
    private final CropJpaRepository cropJpaRepository;

    public List<AdminSmearResponse> getSmears() {
        List<TaskEntity> tasks = taskJpaRepository.findAllByOriginalFilenameIsNotNullOrderByIdDesc();
        Map<Long, Long> totalCounts = toCountMap(cropJpaRepository.countByTaskId());
        Map<Long, Long> labeledCounts = toCountMap(cropJpaRepository.countLabeledByTaskId());

        return tasks.stream()
                .map(task -> {
                    long total = totalCounts.getOrDefault(task.getId(), 0L);
                    long labeled = labeledCounts.getOrDefault(task.getId(), 0L);
                    boolean hasLabel = labeled > 0;
                    return new AdminSmearResponse(
                            task.getId(),
                            task.getOriginalFilename(),
                            task.getUploadedFilename(),
                            task.getCreatedAt(),
                            total,
                            labeled,
                            hasLabel
                    );
                })
                .toList();
    }

    public List<AdminCropResponse> getCrops() {
        List<CropEntity> crops = cropJpaRepository.findAllWithTaskOriginalFilename();
        return crops.stream()
                .map(crop -> {
                    TaskEntity task = crop.getTask();
                    String gtLabel = crop.getGtLabel() != null ? crop.getGtLabel().name() : null;
                    String pseudoLabel = crop.getPseudoLabel() != null ? crop.getPseudoLabel().name() : null;
                    String finalLabel = crop.getFinalLabel() != null ? crop.getFinalLabel().name() : null;
                    boolean hasLabel = crop.getFinalLabel() != null;
                    return new AdminCropResponse(
                            crop.getId(),
                            task != null ? task.getId() : null,
                            crop.getCropFilename(),
                            task != null ? task.getOriginalFilename() : null,
                        gtLabel,
                        pseudoLabel,
                            finalLabel,
                            hasLabel
                    );
                })
                .toList();
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2) {
                continue;
            }
            Long taskId = (Long) row[0];
            long count = ((Number) row[1]).longValue();
            map.put(taskId, count);
        }
        return map;
    }
}
