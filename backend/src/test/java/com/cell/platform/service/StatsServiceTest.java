package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.submission.SubmissionRepository;
import com.cell.platform.dto.response.CropStatsResponse;
import com.cell.platform.fixture.CropFixture;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @InjectMocks private StatsService statsService;
    @Mock private CropRepository cropRepository;
    @Mock private SubmissionRepository submissionRepository;

    @Nested
    class getTaskStats_메서드는 {

        @Test
        void hardScore_내림차순으로_정렬된다() {
            Crop crop1 = CropFixture.createDomainWithFinalLabel();
            Crop crop2 = Crop.builder()
                    .id(2L).taskId(1L).cropFilename("crop2.jpg").bbox("[0,0,10,10]")
                    .aiPrediction(CellType.Band).aiConfidence(0.5).finalLabel(CellType.Band).build();

            given(cropRepository.findAllByTaskId(1L)).willReturn(List.of(crop1, crop2));
            given(submissionRepository.findAllByCropIdIn(List.of(1L, 2L))).willReturn(List.of());

            List<CropStatsResponse> result = statsService.getTaskStats(1L);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).hardScore()).isGreaterThanOrEqualTo(result.get(1).hardScore());
        }
    }

    @Nested
    class getAllStats_메서드는 {

        @Test
        void errorRate_내림차순으로_정렬된다() {
            Crop crop = CropFixture.createDomainWithFinalLabel();
            Submission wrong = Submission.builder()
                    .id(1L).cropId(1L).studentId("s1").studentLabel(CellType.Band).build();

            given(cropRepository.findAll()).willReturn(List.of(crop));
            given(submissionRepository.findAllByCropIdIn(List.of(1L))).willReturn(List.of(wrong));

            List<CropStatsResponse> result = statsService.getAllStats();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).errorRate()).isEqualTo(100.0);
        }

        @Test
        void voteDistribution에_모든_셀타입이_포함된다() {
            given(cropRepository.findAll()).willReturn(List.of(CropFixture.createDomain()));
            given(submissionRepository.findAllByCropIdIn(List.of(1L))).willReturn(List.of());

            List<CropStatsResponse> result = statsService.getAllStats();

            assertThat(result.get(0).voteDistribution()).containsKeys(
                    "Band", "Segment", "Lymphocyte", "Monocyte", "Eosinophil", "NucleatedRBC");
        }
    }
}