package com.cell.platform.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/** Student-visible history deliberately contains no grading data or answer keys. */
public record StudentHistoryResponse(List<Activity> activities) {
    public record Activity(String scopeType, Long scopeId, String title, LocalDateTime deadlineAt,
                           int totalCells, int answeredCells, List<TaskHistory> tasks) {}
    public record TaskHistory(Long taskId, String filename, int totalCells, int answeredCells) {}
    public record Answer(Long cropId, String cropFilename, String studentLabel, LocalDateTime submittedAt) {}

    public static StudentHistoryResponse from(StudentLearningResponse history) {
        return new StudentHistoryResponse(history.activities().stream()
                .filter(a -> a.summary().answeredCells() > 0)
                .map(a -> new Activity(a.scopeType(), a.scopeId(), a.title(), a.deadlineAt(),
                        a.summary().totalCells(), a.summary().answeredCells(), a.tasks().stream()
                        .map(t -> new TaskHistory(t.taskId(), t.filename(), t.summary().totalCells(),
                                t.summary().answeredCells())).toList())).toList());
    }

    public static List<Answer> answers(StudentLearningResponse.TaskDetail detail) {
        return detail.cells().stream().filter(c -> c.studentLabel() != null)
                .map(c -> new Answer(c.cropId(), c.cropFilename(), c.studentLabel(), c.submittedAt())).toList();
    }
}
