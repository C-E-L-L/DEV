package com.cell.platform.domain.submission;

import java.util.List;

public interface SubmissionRepository {

    Submission save(Submission submission);

    List<Submission> findAllByCropId(Long cropId);

    List<Submission> findAllByCropIdIn(List<Long> cropIds);

    List<Submission> findAllByCropIdInAndStudentId(List<Long> cropIds, String studentId);
}
