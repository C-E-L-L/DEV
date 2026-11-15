package com.cell.platform.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/** Recent events for the professor dashboard and notification bell, newest first. */
public record ProfessorActivityResponse(List<Event> events, int unansweredReports) {

    /**
     * {@code type}: SUBMITTED (a student finally submitted), QUESTION (a student report/question),
     * DEADLINE_PASSED (a coursework closed). {@code taskId} opens the coursework results.
     */
    public record Event(String id, String type, LocalDateTime at, Long taskId, String title,
                        String studentId, String studentName, Long reportId, String detail,
                        Boolean answered, Integer pendingLabels) {}
}
