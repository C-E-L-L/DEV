package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.CropRepository;
import com.cell.platform.dto.response.CropResponse;
import com.cell.platform.dto.response.TrainingDataResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.crop.CropCoreRepository;
import com.cell.platform.fixture.CropFixture;
import com.cell.platform.fixture.TaskFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class CropServiceTest {

    private CropService cropService;
    @Mock private CropRepository cropRepository;
    @Mock private CropCoreRepository cropCoreRepository;

    @BeforeEach
    void setUp() {
        cropService = new CropService(cropRepository, cropCoreRepository);
    }

    @Nested
    class getCropsByTaskId_메서드는 {

        @Test
        void 해당_과제의_크롭_목록을_반환한다() {
            given(cropRepository.findAllByTaskId(1L)).willReturn(List.of(CropFixture.createDomain()));

            List<CropResponse> result = cropService.getCropsByTaskId(1L);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    class getConfirmedTrainingData_메서드는 {

        @Test
        void 확정된_크롭만_반환한다() {
            given(cropRepository.findAllByFinalLabelIsNotNull())
                    .willReturn(List.of(CropFixture.createDomainWithFinalLabel()));

            List<TrainingDataResponse> result = cropService.getConfirmedTrainingData();

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    class confirmLabel_메서드는 {

        @Test
        void 정상적으로_라벨을_확정한다() {
            CropEntity entity = CropFixture.createEntity(TaskFixture.createEntity());
            given(cropCoreRepository.findEntityById(1L)).willReturn(entity);

            cropService.confirmLabel(1L, "Monocyte");

            assertThat(entity.getFinalLabel()).isEqualTo(CellType.Monocyte);
        }

        @Test
        void 크롭이_없으면_예외가_발생한다() {
            given(cropCoreRepository.findEntityById(999L)).willReturn(null);

            assertThrows(NotFoundException.class,
                    () -> cropService.confirmLabel(999L, "Band"));
        }

        @Test
        void 유효하지_않은_셀타입이면_예외가_발생한다() {
            assertThrows(BadRequestException.class,
                    () -> cropService.confirmLabel(1L, "InvalidType"));
        }
    }
}