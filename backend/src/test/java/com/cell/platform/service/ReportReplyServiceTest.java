package com.cell.platform.service;

import com.cell.platform.domain.crop.*;
import com.cell.platform.domain.user.*;
import com.cell.platform.dto.request.CropIssueReportRequest;
import com.cell.platform.entity.*;
import com.cell.platform.infra.report.*;
import com.cell.platform.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportReplyServiceTest {
    @Mock CropIssueReportJpaRepository reports;
    @Mock CropIssueReplyJpaRepository replies;
    @Mock CropRepository crops;
    @Mock UserRepository users;
    @InjectMocks CropIssueReportService service;

    private CropIssueReportEntity report() {
        var report = new CropIssueReportEntity();
        report.setId(1L); report.setCropId(2L); report.setTaskId(3L); report.setStudentId("s1"); report.setReason("Question");
        return report;
    }

    @Test
    void creationCannotImpersonateAnotherStudent() {
        when(crops.findById(2L)).thenReturn(Optional.of(Crop.builder().id(2L).taskId(3L).taskPublished(true).build()));
        service.createReport(new CropIssueReportRequest(3L, 2L, "s2", " question "), "s1");
        var capture = ArgumentCaptor.forClass(CropIssueReportEntity.class);
        verify(reports).save(capture.capture());
        assertThat(capture.getValue().getStudentId()).isEqualTo("s1");
        assertThat(capture.getValue().getReason()).isEqualTo("question");
    }

    @Test
    void invalidCropAndTaskAreRejected() {
        when(crops.findById(2L)).thenReturn(Optional.of(Crop.builder().id(2L).taskId(3L).taskPublished(true).build()));
        assertThatThrownBy(() -> service.createReport(new CropIssueReportRequest(9L, 2L, null, "question"), "s1"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.createReport(new CropIssueReportRequest(3L, 99L, null, "question"), "s1"))
                .isInstanceOf(NotFoundException.class);
        verifyNoInteractions(reports);
    }

    @Test
    void staffReplyPreservesAuthorAndTrimsText() {
        when(users.findByUsername("teacher")).thenReturn(Optional.of(User.create("teacher", "Professor", "hash", Role.EXPERT)));
        when(reports.findById(1L)).thenReturn(Optional.of(report()));
        when(replies.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.reply(1L, "teacher", " explanation\nwith detail ");
        assertThat(result.authorUsername()).isEqualTo("teacher");
        assertThat(result.authorName()).isEqualTo("Professor");
        assertThat(result.authorRole()).isEqualTo("EXPERT");
        assertThat(result.message()).isEqualTo("explanation\nwith detail");
    }

    @Test
    void cannotReplyToDeletedReport() {
        when(users.findByUsername("admin")).thenReturn(Optional.of(User.create("admin", "hash", Role.ADMIN)));
        assertThatThrownBy(() -> service.reply(99L, "admin", "answer")).isInstanceOf(NotFoundException.class);
        verifyNoInteractions(replies);
    }

    @Test
    void serviceAlsoRejectsStudentReplyAndBlankText() {
        when(users.findByUsername("s1")).thenReturn(Optional.of(User.create("s1", "hash", Role.STUDENT)));
        assertThatThrownBy(() -> service.reply(1L, "s1", "answer")).isInstanceOf(AuthorizationException.class);
        assertThatThrownBy(() -> service.reply(1L, "teacher", "   ")).isInstanceOf(BadRequestException.class);
        verifyNoInteractions(replies);
    }

    @Test
    void ownReportsIncludeOrderedReplyThreadEvenIfCropWasRemoved() {
        var report = report();
        when(reports.findAllByStudentIdOrderByCreatedAtDescIdDesc("s1")).thenReturn(List.of(report));
        var first = new CropIssueReplyEntity(); first.setReport(report); first.setMessage("First");
        var second = new CropIssueReplyEntity(); second.setReport(report); second.setMessage("Follow-up");
        when(replies.findAllByReportIdInOrderByCreatedAtAscIdAsc(List.of(1L))).thenReturn(List.of(first, second));
        var result = service.getMyReports("s1");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).replies()).extracting(r -> r.message()).containsExactly("First", "Follow-up");
        assertThat(result.get(0).cropFilename()).isNull();
        verify(reports, never()).findAllByOrderByCreatedAtDescIdDesc();
    }
}
