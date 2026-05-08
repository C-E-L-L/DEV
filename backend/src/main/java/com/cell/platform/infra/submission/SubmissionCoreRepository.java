package com.cell.platform.infra.submission;

import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.SubmissionEntity;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class SubmissionCoreRepository implements SubmissionRepository {

    private final SubmissionJpaRepository submissionJpaRepository;
    private final CropJpaRepository cropJpaRepository;

    @Override
    public Submission save(Submission submission) {
        CropEntity cropEntity = cropJpaRepository.findById(submission.getCropId())
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + submission.getCropId()));
        SubmissionEntity entity = Mapper.convertToSubmissionEntity(submission, cropEntity);
        SubmissionEntity saved = submissionJpaRepository.save(entity);
        return Mapper.convertToSubmission(saved);
    }

    @Override
    public List<Submission> findAllByCropId(Long cropId) {
        return submissionJpaRepository.findAllByCrop_Id(cropId).stream()
                .map(Mapper::convertToSubmission)
                .toList();
    }

    @Override
    public List<Submission> findAllByCropIdIn(List<Long> cropIds) {
        return submissionJpaRepository.findAllByCrop_IdIn(cropIds).stream()
                .map(Mapper::convertToSubmission)
                .toList();
    }

    @Override
    public List<Submission> findAllByCropIdInAndStudentId(List<Long> cropIds, String studentId) {
        return submissionJpaRepository.findAllByCrop_IdInAndStudentId(cropIds, studentId).stream()
                .map(Mapper::convertToSubmission)
                .toList();
    }
}
