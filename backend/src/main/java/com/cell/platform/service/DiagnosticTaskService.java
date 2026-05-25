package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.dto.request.DiagnosticTaskCreateRequest;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.DiagnosticPoolStatsResponse;
import com.cell.platform.dto.response.TaskUploadResponse;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiagnosticTaskService {

    private final DiagnosticDatasetService diagnosticDatasetService;
    private final TaskRepository taskRepository;

    public DiagnosticPoolStatsResponse getPoolStats() {
        Map<CellType, Integer> available = diagnosticDatasetService.getAvailableCounts();
        Map<String, Integer> byClass = new LinkedHashMap<>();
        int total = 0;
        for (CellType type : CellType.values()) {
            int count = available.getOrDefault(type, 0);
            byClass.put(type.name(), count);
            total += count;
        }
        return new DiagnosticPoolStatsResponse(total, byClass);
    }

    @Transactional
    public TaskUploadResponse createDiagnosticTask(DiagnosticTaskCreateRequest request) {
        Map<CellType, Integer> available = diagnosticDatasetService.getAvailableCounts();
        Map<CellType, Integer> distribution = normalizeAndValidateDistribution(request, available);
        List<DiagnosticDatasetService.DiagnosticCell> selected = diagnosticDatasetService.sampleCells(distribution);

        String title = "diagnostic-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        Task task = Task.create("", title);
        selected.forEach(cell -> {
            Crop crop = Crop.create(cell.cropFilename(), cell.bbox(), cell.label(), null, null, null);
            task.getCrops().add(crop);
        });

        Task savedTask = taskRepository.save(task);
        List<CropResponse> cropResponses = savedTask.getCrops().stream()
                .map(CropResponse::from)
                .toList();
        return TaskUploadResponse.of(savedTask.getId(), savedTask.getOriginalFilename(), cropResponses);
    }

    private Map<CellType, Integer> normalizeAndValidateDistribution(
            DiagnosticTaskCreateRequest request,
            Map<CellType, Integer> available
    ) {
        int totalQuestions = request.totalQuestions();
        Map<String, Integer> raw = request.classDistribution();

        Set<String> validKeys = new HashSet<>();
        for (CellType type : CellType.values()) {
            validKeys.add(type.name());
        }
        List<String> unknownKeys = raw.keySet().stream()
                .filter(key -> !validKeys.contains(key))
                .toList();
        if (!unknownKeys.isEmpty()) {
            throw new BadRequestException("지원하지 않는 클래스가 포함되어 있습니다: " + unknownKeys, ErrorCode.G000);
        }

        Map<CellType, Integer> normalized = new LinkedHashMap<>();
        int sum = 0;
        for (CellType type : CellType.values()) {
            int requested = Math.max(raw.getOrDefault(type.name(), 0), 0);
            int max = available.getOrDefault(type, 0);
            if (requested > max) {
                throw new BadRequestException(
                        type.name() + " 요청 개수가 최대 보유량을 초과했습니다. 요청=" + requested + ", 최대=" + max,
                        ErrorCode.G000
                );
            }
            normalized.put(type, requested);
            sum += requested;
        }

        if (sum != totalQuestions) {
            throw new BadRequestException(
                    "클래스 분포 합계(" + sum + ")와 전체 문제 수(" + totalQuestions + ")가 일치하지 않습니다.",
                    ErrorCode.G000
            );
        }
        if (sum <= 0) {
            throw new BadRequestException("최소 1개 이상의 문제를 선택해야 합니다.", ErrorCode.G000);
        }
        return normalized;
    }
}
