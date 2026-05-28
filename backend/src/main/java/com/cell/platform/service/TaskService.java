package com.cell.platform.service;

import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.dto.response.AiAnalysisResponse;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.dto.response.TaskUploadResponse;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.matrix.ConfusionMatrixJpaRepository;
import com.cell.platform.infra.report.CropIssueReportJpaRepository;
import com.cell.platform.infra.submission.SubmissionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final FileStorageService fileStorageService;
    private final AiClientService aiClientService;
    private final SubmissionJpaRepository submissionJpaRepository;
    private final ConfusionMatrixJpaRepository confusionMatrixJpaRepository;
    private final CropIssueReportJpaRepository cropIssueReportJpaRepository;

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAllByOrderByIdDesc().stream()
                .map(TaskResponse::from)
                .toList();
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "과제(Task)를 찾을 수 없습니다. taskId=" + id, ErrorCode.T000));
    }

    @Transactional
    public TaskUploadResponse createTask(MultipartFile file) {
        String filename = fileStorageService.saveOriginal(file);
        Task task = Task.create(filename, file.getOriginalFilename());
        AiAnalysisResponse aiResult = aiClientService.analyze(file);
        addCropsToTask(task, aiResult);

        Task savedTask = taskRepository.save(task);

        List<CropResponse> cropResponses = savedTask.getCrops().stream()
                .map(CropResponse::from)
                .toList();
        return TaskUploadResponse.of(savedTask.getId(), filename, cropResponses);
    }

    private void addCropsToTask(Task task, AiAnalysisResponse aiResult) {
        aiResult.getCells().forEach(cell -> {
            Crop crop = Crop.create(
                    cell.getCropFilename(),
                    cell.getBbox(),
                    null,
                    parseCellType(cell.getPrediction()),
                    null,
                    cell.getConfidence()
            );
            task.getCrops().add(crop);
        });
    }

    @Transactional
    public void deleteTask(Long taskId) {
        Task task = getTaskById(taskId);
        List<Long> cropIds = task.getCrops().stream().map(Crop::getId).toList();

        if (!cropIds.isEmpty()) {
            submissionJpaRepository.deleteAllByCropIdIn(cropIds);
        }
        confusionMatrixJpaRepository.deleteAllByTaskId(taskId);
        cropIssueReportJpaRepository.deleteAllByTaskId(taskId);
        taskRepository.deleteById(taskId);
    }

    private CellType parseCellType(String prediction) {
        if (prediction == null) return null;
        try {
            return CellType.valueOf(prediction);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
