package com.cell.platform.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/** Who has (not) finally submitted each published coursework. */
public record ProfessorProgressResponse(List<Student> students, List<Item> items) {

    /** {@code registered} is false for a roster entry whose student has not signed up yet. */
    public record Student(String studentId, String name, String section, boolean registered) {}

    /** One published coursework: a single task, or every smear of an assignment. {@code id} is its newest task. */
    public record Item(Long id, Long assignmentId, List<Long> taskIds, String title, String kind,
                       LocalDateTime deadlineAt, List<Submitted> submitted) {}

    public record Submitted(String studentId, LocalDateTime finalizedAt) {}
}
