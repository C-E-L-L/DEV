package com.cell.platform.service;

import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.dto.response.AiAnalysisResponse;
import com.cell.platform.dto.response.AssignmentResponse;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.dto.response.TaskUploadResponse;
import com.cell.platform.entity.AssignmentEntity;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.assignment.AssignmentJpaRepository;
import com.cell.platform.infra.matrix.ConfusionMatrixJpaRepository;
import com.cell.platform.infra.report.CropIssueReportJpaRepository;
import com.cell.platform.infra.submission.SubmissionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;
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
    private final AssignmentJpaRepository assignmentJpaRepository;
    private final CropRepository cropRepository;

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
    public AssignmentResponse createAssignment(String title, String expertUsername,
                                               List<MultipartFile> files, boolean mixGt) {
        AssignmentEntity assignment = assignmentJpaRepository.save(
                AssignmentEntity.builder()
                        .title(title)
                        .expertUsername(expertUsername)
                        .build()
        );

        List<TaskUploadResponse> taskResponses = new ArrayList<>();
        int totalCrops = 0;

        for (MultipartFile file : files) {
            String filename = fileStorageService.saveOriginal(file);
            Task task = Task.createForAssignment(filename, file.getOriginalFilename(),
                    assignment.getId(), title);
            AiAnalysisResponse aiResult = aiClientService.analyze(file);
            addCropsToTask(task, aiResult);
            Task savedTask = taskRepository.save(task);
            totalCrops += savedTask.getCrops().size();

            List<CropResponse> cropResponses = savedTask.getCrops().stream()
                    .map(CropResponse::from).toList();
            taskResponses.add(TaskUploadResponse.of(savedTask.getId(), filename, cropResponses));
        }

        int embeddedGt = 0;
        if (mixGt && totalCrops > 0) {
            embeddedGt = embedGtCrops(taskResponses, totalCrops);
        }

        return new AssignmentResponse(assignment.getId(), title, expertUsername,
                assignment.getCreatedAt(), taskResponses, totalCrops, embeddedGt);
    }

    private int embedGtCrops(List<TaskUploadResponse> taskResponses, int totalCrops) {
        List<Crop> gtPool = cropRepository.findGtCropsFromDiagnosticTasks();
        if (gtPool.isEmpty() || taskResponses.isEmpty()) return 0;

        int target = Math.max(1, (int) Math.round(totalCrops * 0.10));
        Collections.shuffle(gtPool);
        List<Crop> selected = gtPool.subList(0, Math.min(target, gtPool.size()));

        Long firstTaskId = taskResponses.get(0).taskId();
        Task firstTask = getTaskById(firstTaskId);
        selected.forEach(gtCrop -> {
            Crop embedded = Crop.create(
                    gtCrop.getCropFilename(), null,
                    gtCrop.getGtLabel(), null, null, null
            );
            firstTask.getCrops().add(embedded);
        });
        taskRepository.save(firstTask);
        return selected.size();
    }

    @Transactional
    public void deleteAssignment(Long assignmentId) {
        List<Task> tasks = taskRepository.findByAssignmentId(assignmentId);
        for (Task task : tasks) {
            deleteTask(task.getId());
        }
        assignmentJpaRepository.deleteById(assignmentId);
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
