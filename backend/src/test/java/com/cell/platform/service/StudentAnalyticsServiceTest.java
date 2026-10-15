package com.cell.platform.service;

import com.cell.platform.domain.crop.*;
import com.cell.platform.domain.submission.*;
import com.cell.platform.domain.task.*;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.domain.matrix.ConfusionMatrixRepository;
import com.cell.platform.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentAnalyticsServiceTest {
    @Mock TaskRepository tasks;
    @Mock CropRepository crops;
    @Mock SubmissionRepository submissions;
    @Mock UserRepository users;
    @Mock DiagnosticDatasetService dataset;
    @Mock ConfusionMatrixRepository matrices;
    StudentAnalyticsService service;

    @BeforeEach
    void setup() {
        service = new StudentAnalyticsService(tasks, crops, submissions,
                new SubmissionService(submissions, crops, users, tasks, dataset, matrices));
    }

    private Task task(long id, Long assignmentId) {
        return Task.builder().id(id).assignmentId(assignmentId).title("과제 " + id).uploadedFilename("smear.jpg").build();
    }

    private Crop crop(long id, long taskId, CellType label) {
        return Crop.builder().id(id).taskId(taskId).cropFilename("cell-" + id + ".jpg").finalLabel(label).build();
    }

    private Submission answer(long cropId, CellType label) {
        return Submission.builder().cropId(cropId).studentId("s1").studentLabel(label).build();
    }

    @Test
    void groupsAssignmentsAndSeparatesPendingFromWrongAndUnanswered() {
        when(tasks.findAllByOrderByIdDesc()).thenReturn(List.of(task(3, null), task(2, 10L), task(1, 10L)));
        when(crops.findAllByTaskIdIn(anyList())).thenReturn(List.of(crop(1, 1, CellType.Band), crop(2, 1, null),
                crop(3, 2, CellType.Segment), crop(4, 3, CellType.Band), crop(5, 3, CellType.Segment)));
        when(submissions.findAllByCropIdInAndStudentId(anyList(), eq("s1")))
                .thenReturn(List.of(answer(1, CellType.Band), answer(2, CellType.Segment), answer(4, CellType.Segment)));

        var result = service.getHistory("s1");
        assertThat(result.activities()).hasSize(2);
        var standalone = result.activities().get(0);
        assertThat(standalone.scopeType()).isEqualTo("TASK");
        assertThat(standalone.summary().accuracy()).isEqualTo(0.0);
        assertThat(standalone.summary().wrong()).isEqualTo(1);
        var assignment = result.activities().get(1);
        assertThat(assignment.scopeType()).isEqualTo("ASSIGNMENT");
        assertThat(assignment.scopeId()).isEqualTo(10L);
        assertThat(assignment.tasks()).extracting(item -> item.taskId()).containsExactly(1L, 2L);
        assertThat(assignment.summary().totalCells()).isEqualTo(3);
        assertThat(assignment.summary().answeredCells()).isEqualTo(2);
        assertThat(assignment.summary().correct()).isEqualTo(1);
        assertThat(assignment.summary().wrong()).isZero();
        assertThat(assignment.summary().pendingAnswers()).isEqualTo(1);
        assertThat(assignment.summary().accuracy()).isNull();
        verify(submissions, times(1)).findAllByCropIdInAndStudentId(anyList(), eq("s1"));
    }

    @Test
    void taskDetailIncludesUnansweredCellsAndUsesAllCellsAsDenominator() {
        when(tasks.findById(1L)).thenReturn(Optional.of(task(1, null)));
        when(crops.findAllByTaskId(1L)).thenReturn(List.of(crop(3, 1, CellType.Band), crop(1, 1, CellType.Band), crop(2, 1, CellType.Segment)));
        when(submissions.findAllByCropIdInAndStudentId(anyList(), eq("s1"))).thenReturn(List.of(answer(1, CellType.Band)));
        var detail = service.getTaskDetail("s1", 1L);
        assertThat(detail.cells()).extracting(cell -> cell.cropId()).containsExactly(1L, 2L, 3L);
        assertThat(detail.cells().get(1).studentLabel()).isNull();
        assertThat(detail.cells().get(1).isCorrect()).isNull();
        assertThat(detail.task().summary().accuracy()).isEqualTo(33.3);
        assertThat(detail.task().summary().wrong()).isZero();
    }

    @Test
    void diagnosticUsesGtAndManifestButOrdinaryTasksRequireFinalLabels() {
        Task diagnostic = Task.builder().id(2L).uploadedFilename("diagnostic-test").build();
        when(tasks.findAllByOrderByIdDesc()).thenReturn(List.of(diagnostic, task(1, null)));
        when(crops.findAllByTaskIdIn(anyList())).thenReturn(List.of(
                Crop.builder().id(1L).taskId(1L).gtLabel(CellType.Band).pseudoLabel(CellType.Band).build(),
                Crop.builder().id(2L).taskId(2L).gtLabel(CellType.Band).build(),
                Crop.builder().id(3L).taskId(2L).cropFilename("legacy.jpg").build()));
        when(submissions.findAllByCropIdInAndStudentId(anyList(), eq("s1")))
                .thenReturn(List.of(answer(1, CellType.Band), answer(2, CellType.Band), answer(3, CellType.Band)));
        when(dataset.findLabelByCropFilename("legacy.jpg")).thenReturn(Optional.of(CellType.Band));
        var result = service.getHistory("s1");
        assertThat(result.activities().get(0).scopeType()).isEqualTo("DIAGNOSTIC");
        assertThat(result.activities().get(0).summary().accuracy()).isEqualTo(100.0);
        assertThat(result.activities().get(1).summary().accuracy()).isNull();
        assertThat(result.activities().get(1).summary().pendingAnswers()).isEqualTo(1);
    }

    @Test
    void studentsWithoutAnswersAndTasksWithoutCellsHaveNoArtificialCompletion() {
        when(tasks.findAllByOrderByIdDesc()).thenReturn(List.of(task(2, null), task(1, null)));
        when(crops.findAllByTaskIdIn(anyList())).thenReturn(List.of(crop(1, 1, CellType.Band)));
        when(submissions.findAllByCropIdInAndStudentId(anyList(), eq("new-student"))).thenReturn(List.of());
        var result = service.getHistory("new-student");
        assertThat(result.activities().get(0).summary().totalCells()).isZero();
        assertThat(result.activities().get(0).summary().labelingComplete()).isFalse();
        assertThat(result.activities().get(0).summary().accuracy()).isNull();
        assertThat(result.activities().get(1).summary().answeredCells()).isZero();
        assertThat(result.activities().get(1).summary().wrong()).isZero();
    }

    @Test
    void missingTasksReturnNotFoundAndEmptyTaskListNeedsNoSubmissionQuery() {
        when(tasks.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getTaskDetail("s1", 99L)).isInstanceOf(NotFoundException.class);
        when(tasks.findAllByOrderByIdDesc()).thenReturn(List.of());
        assertThat(service.getHistory("s1").activities()).isEmpty();
        verifyNoInteractions(crops, submissions);
    }
}
