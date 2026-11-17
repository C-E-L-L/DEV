package com.cell.platform.service;

import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.domain.user.UserStatus;
import com.cell.platform.dto.response.ProfessorActivityResponse;
import com.cell.platform.dto.response.ProfessorActivityResponse.Event;
import com.cell.platform.dto.response.ProfessorGradebookResponse;
import com.cell.platform.dto.response.ProfessorProgressResponse;
import com.cell.platform.dto.response.ProfessorProgressResponse.Item;
import com.cell.platform.dto.response.ProfessorProgressResponse.Student;
import com.cell.platform.dto.response.ProfessorProgressResponse.Submitted;
import com.cell.platform.entity.CropIssueReportEntity;
import com.cell.platform.entity.StudentRosterEntity;
import com.cell.platform.entity.TaskAttemptEntity;
import com.cell.platform.infra.report.CropIssueReplyJpaRepository;
import com.cell.platform.infra.report.CropIssueReportJpaRepository;
import com.cell.platform.infra.submission.TaskAttemptJpaRepository;
import com.cell.platform.infra.user.StudentRosterJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Read-only summaries for the professor dashboard. Everything is derived from existing records
 * (final submissions, reports, deadlines); nothing is stored for the dashboard itself.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfessorDashboardService {
    private static final int MAX_EVENTS = 100;
    private static final int DETAIL_LENGTH = 80;

    private final TaskRepository tasks;
    private final UserRepository users;
    private final TaskAttemptJpaRepository attempts;
    private final StudentRosterJpaRepository roster;
    private final CropIssueReportJpaRepository reports;
    private final CropIssueReplyJpaRepository replies;
    private final SubmissionRepository submissions;
    private final SubmissionService grading;

    public ProfessorProgressResponse getProgress() {
        List<Student> students = students();
        Set<String> studentIds = students.stream().map(Student::studentId).collect(Collectors.toSet());
        List<List<Task>> scopes = publishedScopes();
        Map<Long, List<TaskAttemptEntity>> attemptsByTask = attemptsByTask(scopes);
        List<Item> items = scopes.stream().map(scope -> {
            List<Submitted> submitted = latestAttempts(scope, attemptsByTask).entrySet().stream()
                    .filter(entry -> studentIds.contains(entry.getKey()))
                    .map(entry -> new Submitted(entry.getKey(), entry.getValue())).toList();
            Task first = scope.get(0);
            return new Item(first.getId(), first.getAssignmentId(), scope.stream().map(Task::getId).toList(),
                    title(first), first.getKind().name(), deadline(scope), submitted);
        }).toList();
        return new ProfessorProgressResponse(students, items);
    }

    /** Every student against every published coursework: answers, confirmed-answer score and final submission. */
    public ProfessorGradebookResponse getGradebook() {
        List<Student> students = students();
        Set<String> studentIds = students.stream().map(Student::studentId).collect(Collectors.toSet());
        List<List<Task>> scopes = publishedScopes();
        Map<Long, List<TaskAttemptEntity>> attemptsByTask = attemptsByTask(scopes);
        Map<Long, Crop> crops = new HashMap<>();
        Map<Long, Long> scopeOfCrop = new HashMap<>();
        Map<Long, Boolean> diagnosticCrop = new HashMap<>();
        List<ProfessorGradebookResponse.Item> items = new ArrayList<>();
        for (List<Task> scope : scopes) {
            Task first = scope.get(0);
            int questions = 0;
            for (Task task : scope) {
                for (Crop crop : task.getCrops()) {
                    if (crop.isExcluded()) continue;
                    questions++;
                    crops.put(crop.getId(), crop);
                    scopeOfCrop.put(crop.getId(), first.getId());
                    diagnosticCrop.put(crop.getId(), task.isDiagnostic());
                }
            }
            items.add(new ProfessorGradebookResponse.Item(first.getId(), scope.stream().map(Task::getId).toList(),
                    title(first), first.getKind().name(), deadline(scope), questions));
        }

        // studentId -> itemId -> [answered, graded, correct]
        Map<String, Map<Long, int[]>> counts = new HashMap<>();
        List<Submission> answers = crops.isEmpty() ? List.of() : submissions.findAllByCropIdIn(List.copyOf(crops.keySet()));
        for (Submission answer : answers) {
            if (!studentIds.contains(answer.getStudentId())) continue;
            Crop crop = crops.get(answer.getCropId());
            int[] count = counts.computeIfAbsent(answer.getStudentId(), ignored -> new HashMap<>())
                    .computeIfAbsent(scopeOfCrop.get(crop.getId()), ignored -> new int[3]);
            count[0]++;
            var correct = grading.resolveCorrectLabel(crop, diagnosticCrop.get(crop.getId()));
            if (correct == null) continue;
            count[1]++;
            if (correct.name().equals(answer.getAnswerLabel())) count[2]++;
        }

        List<ProfessorGradebookResponse.Result> results = new ArrayList<>();
        for (List<Task> scope : scopes) {
            Long itemId = scope.get(0).getId();
            Map<String, LocalDateTime> finalized = latestAttempts(scope, attemptsByTask);
            Set<String> touched = new TreeSet<>(finalized.keySet());
            counts.forEach((studentId, byItem) -> { if (byItem.containsKey(itemId)) touched.add(studentId); });
            for (String studentId : touched) {
                if (!studentIds.contains(studentId)) continue;
                int[] count = counts.getOrDefault(studentId, Map.of()).getOrDefault(itemId, new int[3]);
                results.add(new ProfessorGradebookResponse.Result(studentId, itemId, count[0], count[1], count[2], finalized.get(studentId)));
            }
        }
        return new ProfessorGradebookResponse(students, items, results);
    }

    public ProfessorActivityResponse getActivity(int limit) {
        Map<String, String> names = new HashMap<>();
        for (User user : users.findAllByRole(Role.STUDENT)) names.put(user.getUsername(), user.getName());
        Map<Long, Task> taskById = new HashMap<>();
        for (Task task : tasks.findAllByOrderByIdDesc()) taskById.put(task.getId(), task);
        List<List<Task>> scopes = publishedScopes();
        Map<Long, List<TaskAttemptEntity>> attemptsByTask = attemptsByTask(scopes);
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = new ArrayList<>();

        for (List<Task> scope : scopes) {
            Task first = scope.get(0);
            latestAttempts(scope, attemptsByTask).forEach((studentId, at) -> events.add(new Event(
                    "S-" + first.getId() + "-" + studentId, "SUBMITTED", at, first.getId(), title(first),
                    studentId, names.get(studentId), null, null, null, null)));
            LocalDateTime deadline = deadline(scope);
            if (deadline != null && !deadline.isAfter(now)) {
                int pending = (int) scope.stream().flatMap(task -> task.getCrops().stream())
                        .filter(crop -> !crop.isExcluded() && crop.getFinalLabel() == null).count();
                events.add(new Event("D-" + first.getId() + "-" + deadline, "DEADLINE_PASSED", deadline,
                        first.getId(), title(first), null, null, null, null, null, pending));
            }
        }

        List<CropIssueReportEntity> allReports = reports.findAllByOrderByCreatedAtDescIdDesc();
        Set<Long> answered = allReports.isEmpty() ? Set.of() : replies
                .findAllByReportIdInOrderByCreatedAtAscIdAsc(allReports.stream().map(CropIssueReportEntity::getId).toList())
                .stream().map(reply -> reply.getReport().getId()).collect(Collectors.toSet());
        for (CropIssueReportEntity report : allReports) {
            Task task = taskById.get(report.getTaskId());
            events.add(new Event("Q-" + report.getId(), "QUESTION", report.getCreatedAt(), report.getTaskId(),
                    task == null ? null : title(task), report.getStudentId(), names.get(report.getStudentId()),
                    report.getId(), shorten(report.getReason()), answered.contains(report.getId()), null));
        }

        events.sort(Comparator.comparing(Event::at, Comparator.nullsLast(Comparator.reverseOrder())).thenComparing(Event::id));
        int size = Math.max(1, Math.min(limit, MAX_EVENTS));
        int unanswered = (int) allReports.stream().filter(report -> !answered.contains(report.getId())).count();
        return new ProfessorActivityResponse(events.stream().limit(size).toList(), unanswered);
    }

    /** Active student accounts, plus roster entries that have not signed up yet (they have not submitted either). */
    private List<Student> students() {
        Map<String, StudentRosterEntity> rosterById = new LinkedHashMap<>();
        for (StudentRosterEntity entry : roster.findAll()) rosterById.put(entry.getStudentId(), entry);
        Map<String, Student> result = new TreeMap<>();
        Set<String> accounts = new HashSet<>();
        for (User user : users.findAllByRole(Role.STUDENT)) {
            accounts.add(user.getUsername());
            if (user.getStatus() != UserStatus.ACTIVE) continue;
            StudentRosterEntity entry = rosterById.get(user.getUsername());
            String name = user.getName() != null && !user.getName().isBlank() ? user.getName() : entry == null ? null : entry.getName();
            result.put(user.getUsername(), new Student(user.getUsername(), name, entry == null ? null : entry.getSection(), true));
        }
        for (StudentRosterEntity entry : rosterById.values()) {
            if (accounts.contains(entry.getStudentId())) continue;
            result.put(entry.getStudentId(), new Student(entry.getStudentId(), entry.getName(), entry.getSection(), false));
        }
        return List.copyOf(result.values());
    }

    /** Published coursework, newest first. Smears of one assignment form a single scope. */
    private List<List<Task>> publishedScopes() {
        Map<String, List<Task>> groups = new LinkedHashMap<>();
        for (Task task : tasks.findAllByOrderByIdDesc()) {
            if (!task.isPublished()) continue;
            String key = task.getAssignmentId() == null ? "TASK:" + task.getId() : "ASSIGNMENT:" + task.getAssignmentId();
            groups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(task);
        }
        return List.copyOf(groups.values());
    }

    private Map<Long, List<TaskAttemptEntity>> attemptsByTask(List<List<Task>> scopes) {
        List<Long> ids = scopes.stream().flatMap(List::stream).map(Task::getId).toList();
        if (ids.isEmpty()) return Map.of();
        return attempts.findAllByTaskIdIn(ids).stream().collect(Collectors.groupingBy(TaskAttemptEntity::getTaskId));
    }

    /** A final submission covers the whole scope, so one student counts once per coursework. */
    private Map<String, LocalDateTime> latestAttempts(List<Task> scope, Map<Long, List<TaskAttemptEntity>> attemptsByTask) {
        Map<String, LocalDateTime> latest = new TreeMap<>();
        for (Task task : scope) {
            for (TaskAttemptEntity attempt : attemptsByTask.getOrDefault(task.getId(), List.of())) {
                latest.merge(attempt.getStudentId(), attempt.getFinalizedAt(), (a, b) -> a.isAfter(b) ? a : b);
            }
        }
        return latest;
    }

    private LocalDateTime deadline(List<Task> scope) {
        return scope.stream().map(Task::getDeadlineAt).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null);
    }

    private String title(Task task) {
        if (task.getTitle() != null && !task.getTitle().isBlank()) return task.getTitle();
        if (task.isDiagnostic()) return "진단평가";
        return task.getUploadedFilename() != null ? task.getUploadedFilename() : "Task #" + task.getId();
    }

    private String shorten(String text) {
        if (text == null) return null;
        String line = text.strip().replaceAll("\\s+", " ");
        return line.length() <= DETAIL_LENGTH ? line : line.substring(0, DETAIL_LENGTH) + "…";
    }
}
