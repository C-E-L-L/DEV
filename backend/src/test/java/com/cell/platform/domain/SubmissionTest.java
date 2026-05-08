package com.cell.platform.domain;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.submission.Submission;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SubmissionTest {

    @Nested
    class Submission은 {

        @Test
        void 정상적인_인자가_들어오면_객체가_생성된다() {
            // given
            Long cropId = 1L;
            String studentId = "student01";
            CellType studentLabel = CellType.Lymphocyte;

            // when
            Submission submission = Submission.create(cropId, studentId, studentLabel);

            // then
            assertThat(submission.getCropId()).isEqualTo(cropId);
            assertThat(submission.getStudentId()).isEqualTo(studentId);
            assertThat(submission.getStudentLabel()).isEqualTo(CellType.Lymphocyte);
            assertThat(submission.getId()).isNull();
            assertThat(submission.getSubmittedAt()).isNull();
        }
    }
}