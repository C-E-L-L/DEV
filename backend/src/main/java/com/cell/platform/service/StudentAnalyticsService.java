package com.cell.platform.service;

import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.dto.response.StudentLearningResponse;
import com.cell.platform.dto.response.StudentLearningResponse.*;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentAnalyticsService {
    private final TaskRepository taskRepository;
    private final CropRepository cropRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionService submissionService;

    public StudentLearningResponse getHistory(String studentId) {
        List<Task> tasks = taskRepository.findAllByOrderByIdDesc();
        if (tasks.isEmpty()) return new StudentLearningResponse(studentId, List.of());
        List<Crop> crops = cropRepository.findAllByTaskIdIn(tasks.stream().map(Task::getId).toList());
        Map<Long, Submission> answers = getAnswers(crops, studentId);
        Map<Long, List<Crop>> cropsByTask = crops.stream().collect(Collectors.groupingBy(Crop::getTaskId));
        Map<String, List<Task>> groups = new LinkedHashMap<>();
        for (Task task : tasks) {
            String key = task.getAssignmentId() == null ? "TASK:" + task.getId() : "ASSIGNMENT:" + task.getAssignmentId();
            groups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(task);
        }

        List<Activity> activities = new ArrayList<>();
        for (List<Task> group : groups.values()) {
            group.sort(Comparator.comparing(Task::getId));
            Task first = group.get(0);
            String type = isDiagnostic(first) ? "DIAGNOSTIC" : first.getAssignmentId() != null ? "ASSIGNMENT" : "TASK";
            List<TaskResult> taskResults = new ArrayList<>();
            for (Task task : group) {
                List<CellResult> cells = buildCells(task, cropsByTask.getOrDefault(task.getId(), List.of()), answers);
                taskResults.add(toTaskResult(task, summarize(cells)));
            }
            Summary summary = combine(taskResults.stream().map(TaskResult::summary).toList());
            activities.add(new Activity(type,
                    first.getAssignmentId() != null ? first.getAssignmentId() : first.getId(),
                    title(first), first.getCreatedAt(),
                    group.stream().map(Task::getDeadlineAt).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null),
                    summary, taskResults));
        }
        return new StudentLearningResponse(studentId, activities);
    }

    public TaskDetail getTaskDetail(String studentId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("과제를 찾을 수 없습니다. taskId=" + taskId, ErrorCode.T000));
        List<Crop> crops = cropRepository.findAllByTaskId(taskId);
        List<CellResult> cells = buildCells(task, crops, getAnswers(crops, studentId));
        return new TaskDetail(studentId, toTaskResult(task, summarize(cells)), cells);
    }

    private Map<Long, Submission> getAnswers(List<Crop> crops, String studentId) {
        if (crops.isEmpty()) return Map.of();
        return submissionRepository.findAllByCropIdInAndStudentId(crops.stream().map(Crop::getId).toList(), studentId)
                .stream().collect(Collectors.toMap(Submission::getCropId, Function.identity()));
    }

    private List<CellResult> buildCells(Task task, List<Crop> crops, Map<Long, Submission> answers) {
        return crops.stream().sorted(Comparator.comparing(Crop::getId)).map(crop -> {
            Submission answer = answers.get(crop.getId());
            var label = submissionService.resolveCorrectLabel(crop, isDiagnostic(task));
            String correctLabel = label == null ? null : label.name();
            String studentLabel = answer == null ? null : answer.getStudentLabel().name();
            Boolean correct = studentLabel == null || correctLabel == null ? null : studentLabel.equals(correctLabel);
            return new CellResult(crop.getId(), crop.getCropFilename(), studentLabel, correctLabel, correct,
                    answer == null ? null : answer.getSubmittedAt());
        }).toList();
    }

    private Summary summarize(List<CellResult> cells) {
        int answered = (int) cells.stream().filter(cell -> cell.studentLabel() != null).count();
        int correct = (int) cells.stream().filter(cell -> Boolean.TRUE.equals(cell.isCorrect())).count();
        int wrong = (int) cells.stream().filter(cell -> Boolean.FALSE.equals(cell.isCorrect())).count();
        boolean complete = !cells.isEmpty() && cells.stream().allMatch(cell -> cell.correctLabel() != null);
        return summary(cells.size(), answered, correct, wrong, complete);
    }

    private Summary combine(List<Summary> summaries) {
        int total = summaries.stream().mapToInt(Summary::totalCells).sum();
        boolean complete = total > 0 && summaries.stream().filter(s -> s.totalCells() > 0).allMatch(Summary::labelingComplete);
        return summary(total, summaries.stream().mapToInt(Summary::answeredCells).sum(),
                summaries.stream().mapToInt(Summary::correct).sum(), summaries.stream().mapToInt(Summary::wrong).sum(), complete);
    }

    private Summary summary(int total, int answered, int correct, int wrong, boolean complete) {
        Double accuracy = complete ? Math.round(correct * 1000.0 / total) / 10.0 : null;
        return new Summary(total, answered, correct, wrong, answered - correct - wrong, complete, accuracy);
    }

    private TaskResult toTaskResult(Task task, Summary summary) {
        return new TaskResult(task.getId(), title(task), task.getUploadedFilename() != null
                ? task.getUploadedFilename() : task.getOriginalFilename(), task.getSpeciesCode(), task.getSpeciesName(), summary);
    }

    private boolean isDiagnostic(Task task) {
        return task.getUploadedFilename() != null && task.getUploadedFilename().startsWith("diagnostic-");
    }

    private String title(Task task) {
        if (isDiagnostic(task)) return "Diagnostic #" + task.getId();
        return task.getTitle() != null && !task.getTitle().isBlank() ? task.getTitle() : "Task #" + task.getId();
    }
}
