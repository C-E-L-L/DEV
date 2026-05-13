package com.cell.platform.service;

import com.cell.platform.dto.request.CropIssueReportRequest;
import com.cell.platform.dto.response.CropIssueReportResponse;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.entity.CropIssueReportEntity;
import com.cell.platform.infra.report.CropIssueReportJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CropIssueReportService {

    private final CropIssueReportJpaRepository reportRepository;
    private final CropRepository cropRepository;

    @Transactional
    public void createReport(CropIssueReportRequest request) {
        CropIssueReportEntity entity = new CropIssueReportEntity();
        entity.setStudentId(request.studentId());
        entity.setTaskId(request.taskId());
        entity.setCropId(request.cropId());
        entity.setReason(request.reason());
        reportRepository.save(entity);
    }

    public List<CropIssueReportResponse> getReports() {
        return reportRepository.findAll().stream()
                .map(entity -> {
                    String cropFilename = cropRepository.findById(entity.getCropId())
                            .map(Crop::getCropFilename)
                            .orElse(null);
                    return CropIssueReportResponse.from(entity, cropFilename);
                })
                .toList();
    }
}
