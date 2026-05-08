package com.cell.platform.domain.crop;

import java.util.List;
import java.util.Optional;

public interface CropRepository {

    Crop save(Crop crop);

    Optional<Crop> findById(Long id);

    List<Crop> findAllByTaskId(Long taskId);

    List<Crop> findAllByFinalLabelIsNotNull();

    List<Crop> findAll();
}
