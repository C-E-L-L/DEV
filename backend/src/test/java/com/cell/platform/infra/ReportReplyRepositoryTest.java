package com.cell.platform.infra;

import com.cell.platform.entity.*;
import com.cell.platform.infra.report.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest
class ReportReplyRepositoryTest {
    @Autowired CropIssueReportJpaRepository reports;
    @Autowired CropIssueReplyJpaRepository replies;

    @Test
    void repliesPersistInOrderAndCascadeWhenTaskReportsAreBulkDeleted() {
        var report = new CropIssueReportEntity();
        report.setStudentId("s1"); report.setTaskId(1L); report.setCropId(2L); report.setReason("Question");
        reports.saveAndFlush(report);
        for (String text : List.of("First", "Follow-up")) {
            var reply = new CropIssueReplyEntity();
            reply.setReport(report); reply.setAuthorUsername("teacher"); reply.setAuthorRole("EXPERT"); reply.setMessage(text);
            replies.saveAndFlush(reply);
        }
        assertThat(replies.findAllByReportIdInOrderByCreatedAtAscIdAsc(List.of(report.getId())))
                .extracting(CropIssueReplyEntity::getMessage).containsExactly("First", "Follow-up");
        assertThat(reports.findAllByStudentIdOrderByCreatedAtDescIdDesc("s2")).isEmpty();
        reports.deleteAllByTaskId(1L);
        reports.flush();
        assertThat(replies.count()).isZero();
    }
}
