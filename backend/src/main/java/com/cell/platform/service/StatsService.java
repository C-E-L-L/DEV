package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
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
    private final UserRepository userRepository;

    private static final List<String> CELL_LABELS = Arrays.stream(CellType.values())
            .map(Enum::name)
            .toList();

    public List<CropStatsResponse> getTaskStats(Long taskId) {
        List<Crop> crops = cropRepository.findAllByTaskId(taskId);
        Map<String, String> studentNamesById = new HashMap<>();
        for (User user : userRepository.findAll()) {
            String studentName = normalizeStudentName(user.getName());
            if (user.getUsername() != null && studentName != null) {
                studentNamesById.put(user.getUsername(), studentName);
            }
        }
        return buildStatsList(
                crops,
                Comparator.comparingDouble(CropStatsResponse::hardScore).reversed(),
                studentNamesById
        );
    }

    public List<CropStatsResponse> getAllStats() {
        List<Crop> allCrops = cropRepository.findAll();
        return buildStatsList(
                allCrops,
                Comparator.comparingDouble(CropStatsResponse::errorRate).reversed(),
                null
        );
    }

    private List<CropStatsResponse> buildStatsList(
            List<Crop> crops,
            Comparator<CropStatsResponse> sorter,
            Map<String, String> studentNamesById
    ) {
        List<Long> cropIds = crops.stream().map(Crop::getId).toList();
        List<Submission> allSubmissions = submissionRepository.findAllByCropIdIn(cropIds);

        Map<Long, List<Submission>> submissionMap = allSubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getCropId));

        return crops.stream()
                .map(crop -> buildCropStats(
                        crop,
                        submissionMap.getOrDefault(crop.getId(), List.of()),
                        studentNamesById
                ))
                .sorted(sorter)
                .toList();
    }

    private CropStatsResponse buildCropStats(
            Crop crop,
            List<Submission> submissions,
            Map<String, String> studentNamesById
    ) {
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
        Map<String, List<CropStatsResponse.VoterDetail>> votersByLabel = new LinkedHashMap<>();
        for (String label : CELL_LABELS) {
            int count = (int) submissions.stream()
                    .filter(sub -> sub.getStudentLabel().name().equals(label))
                    .count();
            voteDistribution.put(label, count);
            votersByLabel.put(label, studentNamesById != null
                    ? submissions.stream()
                    .filter(sub -> sub.getStudentLabel().name().equals(label))
                    .filter(sub -> sub.getStudentId() != null)
                    .sorted(Comparator.comparing(Submission::getStudentId))
                    .map(sub -> buildVoterDetail(sub.getStudentId(), studentNamesById))
                    .toList()
                    : List.of());
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
                .votersByLabel(votersByLabel)
                .build();
    }

    private CropStatsResponse.VoterDetail buildVoterDetail(
            String studentId,
            Map<String, String> studentNamesById
    ) {
        String studentName = studentNamesById.get(studentId);
        String displayName = studentName == null ? studentId : studentId + "_" + studentName;
        return new CropStatsResponse.VoterDetail(studentId, studentName, displayName);
    }

    private String normalizeStudentName(String studentName) {
        return studentName == null || studentName.isBlank() ? null : studentName.trim();
    }
}
