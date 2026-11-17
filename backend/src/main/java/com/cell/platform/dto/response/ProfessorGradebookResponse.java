package com.cell.platform.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Students x published coursework. {@code results} only lists pairs where the student answered or
 * finally submitted something; a missing pair means "not started".
 */
public record ProfessorGradebookResponse(List<ProfessorProgressResponse.Student> students, List<Item> items, List<Result> results) {

    /** {@code questions}: cells students answer (excluded cells are not counted). */
    public record Item(Long id, List<Long> taskIds, String title, String kind, LocalDateTime deadlineAt, int questions) {}

    /**
     * {@code graded}: answered cells with a confirmed answer; {@code correct} of those were right.
     * A score is only meaningful once {@code finalizedAt} is set.
     */
    public record Result(String studentId, Long itemId, int answered, int graded, int correct, LocalDateTime finalizedAt) {}
}
