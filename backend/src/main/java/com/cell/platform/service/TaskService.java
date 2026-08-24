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
import com.cell.platform.entity.AnimalSpeciesEntity;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.BadRequestException;
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
import java.util.List;
import java.time.LocalDateTime;

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
    private final AnimalSpeciesService animalSpeciesService;

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
        return createTask(file, null);
    }

    @Transactional
    public TaskUploadResponse createTask(MultipartFile file, LocalDateTime deadlineAt) {
        return createTask(file, deadlineAt, animalSpeciesService.getDog().getId());
    }

    @Transactional
    public TaskUploadResponse createTask(MultipartFile file, LocalDateTime deadlineAt, Long speciesId) {
        validateFutureDeadline(deadlineAt);
        AnimalSpeciesEntity species = speciesId == null
                ? animalSpeciesService.getDog()
                : animalSpeciesService.getRequired(speciesId);
        String filename = fileStorageService.saveOriginal(file, species.getCode());
        Task task = Task.create(filename, file.getOriginalFilename(), deadlineAt,
                species.getId(), species.getCode(), species.getName());
        AiAnalysisResponse aiResult = aiClientService.analyze(file);
        addCropsToTask(task, aiResult);

        Task savedTask = taskRepository.save(task);

        List<CropResponse> cropResponses = savedTask.getCrops().stream()
                .map(CropResponse::from)
                .toList();
        return TaskUploadResponse.of(savedTask, filename, cropResponses);
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
                                               List<MultipartFile> files) {
        return createAssignment(title, expertUsername, files, null);
    }

    @Transactional
    public AssignmentResponse createAssignment(String title, String expertUsername,
                                               List<MultipartFile> files, LocalDateTime deadlineAt) {
        return createAssignment(title, expertUsername, files, deadlineAt, null);
    }

    @Transactional
    public AssignmentResponse createAssignment(String title, String expertUsername,
                                               List<MultipartFile> files, LocalDateTime deadlineAt,
                                               List<Long> speciesIds) {
        validateFutureDeadline(deadlineAt);
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("도말 이미지를 최소 1장 선택해 주세요.", ErrorCode.G000);
        }
        if (speciesIds != null && !speciesIds.isEmpty() && speciesIds.size() != files.size()) {
            throw new BadRequestException("각 도말 이미지마다 동물 종을 선택해 주세요.", ErrorCode.G000);
        }
        AnimalSpeciesEntity defaultSpecies = animalSpeciesService.getDog();
        AssignmentEntity assignment = assignmentJpaRepository.save(
                AssignmentEntity.builder()
                        .title(title)
                        .expertUsername(expertUsername)
                        .build()
        );

        List<TaskUploadResponse> taskResponses = new ArrayList<>();
        int totalCrops = 0;

        for (int index = 0; index < files.size(); index++) {
            MultipartFile file = files.get(index);
            Long speciesId = speciesIds == null || speciesIds.isEmpty() ? null : speciesIds.get(index);
            AnimalSpeciesEntity species = speciesId == null
                    ? defaultSpecies
                    : animalSpeciesService.getRequired(speciesId);
            String filename = fileStorageService.saveOriginal(file, species.getCode());
            Task task = Task.createForAssignment(filename, file.getOriginalFilename(),
                    assignment.getId(), title, deadlineAt,
                    species.getId(), species.getCode(), species.getName());
            AiAnalysisResponse aiResult = aiClientService.analyze(file);
            addCropsToTask(task, aiResult);
            Task savedTask = taskRepository.save(task);
            totalCrops += savedTask.getCrops().size();

            List<CropResponse> cropResponses = savedTask.getCrops().stream()
                    .map(CropResponse::from).toList();
            taskResponses.add(TaskUploadResponse.of(savedTask, filename, cropResponses));
        }

        return new AssignmentResponse(assignment.getId(), title, expertUsername,
                assignment.getCreatedAt(), taskResponses, totalCrops);
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

    @Transactional
    public void updateTaskDeadline(Long taskId, LocalDateTime deadlineAt) {
        Task task = getTaskById(taskId);
        if (task.getAssignmentId() != null) {
            throw new BadRequestException("Assignment 소속 도말은 과제 단위로 마감일을 변경해 주세요.", ErrorCode.G000);
        }
        if (isDiagnosticTask(task)) {
            throw new BadRequestException("진단평가에는 마감일을 설정할 수 없습니다.", ErrorCode.G000);
        }
        validateDeadlineChange(List.of(task), deadlineAt);
        taskRepository.updateDeadlineAt(taskId, deadlineAt);
    }

    @Transactional
    public void updateAssignmentDeadline(Long assignmentId, LocalDateTime deadlineAt) {
        if (!assignmentJpaRepository.existsById(assignmentId)) {
            throw new NotFoundException("과제를 찾을 수 없습니다. assignmentId=" + assignmentId, ErrorCode.T000);
        }
        List<Task> tasks = taskRepository.findByAssignmentId(assignmentId);
        validateDeadlineChange(tasks, deadlineAt);
        taskRepository.updateDeadlineAtByAssignmentId(assignmentId, deadlineAt);
    }

    private void validateDeadlineChange(List<Task> tasks, LocalDateTime deadlineAt) {
        LocalDateTime now = LocalDateTime.now();
        boolean alreadyClosed = tasks.stream()
                .map(Task::getDeadlineAt)
                .anyMatch(current -> current != null && !current.isAfter(now));
        if (alreadyClosed) {
            throw new BadRequestException("이미 마감된 과제의 마감일은 변경하거나 해제할 수 없습니다.", ErrorCode.G000);
        }
        validateFutureDeadline(deadlineAt);
    }

    private void validateFutureDeadline(LocalDateTime deadlineAt) {
        if (deadlineAt != null && !deadlineAt.isAfter(LocalDateTime.now())) {
            throw new BadRequestException("마감일은 현재 시각 이후로 설정해 주세요.", ErrorCode.G000);
        }
    }

    private boolean isDiagnosticTask(Task task) {
        return task.getUploadedFilename() != null
                && task.getUploadedFilename().startsWith("diagnostic-");
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
