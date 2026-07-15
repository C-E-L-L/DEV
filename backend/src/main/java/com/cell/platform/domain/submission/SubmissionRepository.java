package com.cell.platform.domain.submission;

import com.cell.platform.domain.crop.CellType;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository {

    Submission save(Submission submission);

    Optional<Submission> findByCropIdAndStudentId(Long cropId, String studentId);

    void updateLabel(Long cropId, String studentId, CellType newLabel);

    List<Submission> findAllByCropId(Long cropId);

    List<Submission> findAllByCropIdIn(List<Long> cropIds);

    List<Submission> findAllByCropIdInAndStudentId(List<Long> cropIds, String studentId);
}
