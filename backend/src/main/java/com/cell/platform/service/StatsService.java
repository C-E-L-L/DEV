package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.dto.response.CropStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final CropRepository cropRepository;
    private final SubmissionRepository submissionRepository;

    private static final List<String> CELL_LABELS = Arrays.stream(CellType.values())
            .map(Enum::name)
            .toList();

    public List<CropStatsResponse> getTaskStats(Long taskId) {
        List<Crop> crops = cropRepository.findAllByTaskId(taskId);
        return buildStatsList(crops, Comparator.comparingDouble(CropStatsResponse::hardScore).reversed());
    }

    public List<CropStatsResponse> getAllStats() {
        List<Crop> allCrops = cropRepository.findAll();
        return buildStatsList(allCrops, Comparator.comparingDouble(CropStatsResponse::errorRate).reversed());
    }

    private List<CropStatsResponse> buildStatsList(List<Crop> crops, Comparator<CropStatsResponse> sorter) {
        List<Long> cropIds = crops.stream().map(Crop::getId).toList();
        List<Submission> allSubmissions = submissionRepository.findAllByCropIdIn(cropIds);

        Map<Long, List<Submission>> submissionMap = allSubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getCropId));

        return crops.stream()
                .map(crop -> buildCropStats(crop, submissionMap.getOrDefault(crop.getId(), List.of())))
                .sorted(sorter)
                .toList();
    }

    private CropStatsResponse buildCropStats(Crop crop, List<Submission> submissions) {
        int totalAnswers = submissions.size();
        boolean scorable = crop.getFinalLabel() != null;
        String correctLabel = scorable ? crop.getFinalLabel().name() : null;

        List<String> wrongDetails = scorable
                ? submissions.stream()
                .filter(sub -> !sub.getStudentLabel().name().equals(correctLabel))
                .map(sub -> sub.getStudentLabel().name())
                .toList()
                : List.of();

        double errorRate = scorable && totalAnswers > 0
                ? (double) wrongDetails.size() / totalAnswers * 100
                : 0;
        double accuracyRate = scorable ? 100 - errorRate : 0;
        double hardScore = scorable ? errorRate : 0;

        Map<String, Integer> voteDistribution = new LinkedHashMap<>();
        for (String label : CELL_LABELS) {
            int count = (int) submissions.stream()
                    .filter(sub -> sub.getStudentLabel().name().equals(label))
                    .count();
            voteDistribution.put(label, count);
        }

        return CropStatsResponse.builder()
                .taskId(crop.getTaskId())
                .cropId(crop.getId())
                .filename(crop.getCropFilename())
                .originalSmearFilename(crop.getOriginalSmearFilename())
                .bbox(crop.getBbox())
                .gtLabel(crop.getGtLabel() != null ? crop.getGtLabel().name() : null)
                .pseudoLabel(crop.getPseudoLabel() != null ? crop.getPseudoLabel().name() : null)
                .aiBboxConfidence(crop.getAiBboxConfidence())
                .aiClassificationConfidence(crop.getAiClassificationConfidence())
                .finalLabel(crop.getFinalLabel() != null ? crop.getFinalLabel().name() : null)
                .totalAnswers(totalAnswers)
                .errorRate(Math.round(errorRate * 10) / 10.0)
                .accuracyRate(Math.round(accuracyRate * 10) / 10.0)
                .hardScore(hardScore)
                .wrongDetails(wrongDetails)
                .voteDistribution(voteDistribution)
                .build();
    }
}
