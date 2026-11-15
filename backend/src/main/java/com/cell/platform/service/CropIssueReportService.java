package com.cell.platform.service;

import com.cell.platform.dto.request.CropIssueReportRequest;
import com.cell.platform.dto.response.CropIssueReportResponse;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.entity.CropIssueReportEntity;
import com.cell.platform.infra.report.CropIssueReportJpaRepository;
import com.cell.platform.infra.report.CropIssueReplyJpaRepository;
import com.cell.platform.entity.CropIssueReplyEntity;
import com.cell.platform.dto.response.CropIssueReplyResponse;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.domain.user.Role;
import com.cell.platform.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CropIssueReportService {

    private final CropIssueReportJpaRepository reportRepository;
    private final CropRepository cropRepository;
    private final CropIssueReplyJpaRepository replyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createReport(CropIssueReportRequest request, String username) {
        Crop crop = cropRepository.findById(request.cropId())
                .orElseThrow(() -> new NotFoundException("세포를 찾을 수 없습니다.", ErrorCode.G000));
        if (!Objects.equals(crop.getTaskId(), request.taskId())) {
            throw new BadRequestException("해당 과제의 세포가 아닙니다.", ErrorCode.G000);
        }
        if (crop.isExcluded() || !crop.isTaskPublished()) {
            throw new BadRequestException("게시된 과제의 출제 문항에만 질문할 수 있습니다.", ErrorCode.G000);
        }
        CropIssueReportEntity entity = new CropIssueReportEntity();
        entity.setStudentId(username);
        entity.setTaskId(request.taskId());
        entity.setCropId(request.cropId());
        entity.setReason(request.reason().trim());
        reportRepository.save(entity);
    }

    public List<CropIssueReportResponse> getReports() {
        return toResponses(reportRepository.findAllByOrderByCreatedAtDescIdDesc());
    }

    public List<CropIssueReportResponse> getMyReports(String username) {
        return toResponses(reportRepository.findAllByStudentIdOrderByCreatedAtDescIdDesc(username));
    }

    @Transactional
    public CropIssueReplyResponse reply(Long reportId, String username, String message) {
        if (message == null || message.isBlank() || message.length() > 4000) {
            throw new BadRequestException("답변은 1~4000자로 입력해주세요.", ErrorCode.G000);
        }
        var author = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("작성자를 찾을 수 없습니다.", ErrorCode.G000));
        if (author.getRole() != Role.EXPERT && author.getRole() != Role.ADMIN) {
            throw new AuthorizationException("교수와 관리자만 답변할 수 있습니다.", ErrorCode.G000);
        }
        var report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("신고 및 질문을 찾을 수 없습니다.", ErrorCode.G000));
        var reply = new CropIssueReplyEntity();
        reply.setReport(report);
        reply.setAuthorUsername(username);
        reply.setAuthorName(author.getName());
        reply.setAuthorRole(author.getRole().name());
        reply.setMessage(message.trim());
        return CropIssueReplyResponse.from(replyRepository.save(reply));
    }

    private List<CropIssueReportResponse> toResponses(List<CropIssueReportEntity> reports) {
        if (reports.isEmpty()) return List.of();
        Map<Long, List<CropIssueReplyResponse>> replies = replyRepository
                .findAllByReportIdInOrderByCreatedAtAscIdAsc(reports.stream().map(CropIssueReportEntity::getId).toList())
                .stream().collect(Collectors.groupingBy(reply -> reply.getReport().getId(),
                        Collectors.mapping(CropIssueReplyResponse::from, Collectors.toList())));
        return reports.stream()
                .map(entity -> {
                    Crop crop = cropRepository.findById(entity.getCropId()).orElse(null);
                    return CropIssueReportResponse.from(
                            entity,
                            crop != null ? crop.getCropFilename() : null,
                            crop != null ? crop.getSpeciesCode() : AnimalSpeciesService.DOG_CODE,
                            crop != null ? crop.getSpeciesName() : "개 (Dog)",
                            replies.getOrDefault(entity.getId(), List.of())
                    );
                })
                .toList();
    }
}
