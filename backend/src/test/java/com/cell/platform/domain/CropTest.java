package com.cell.platform.domain;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.crop.Crop;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CropTest {

    @Nested
    class Crop은 {

        @Test
        void 정상적인_인자가_들어오면_객체가_생성된다() {
            // given
            String cropFilename = "crop_abc123.jpg";
            String bbox = "[100, 200, 300, 400]";
            CellType aiPrediction = CellType.Lymphocyte;
            Double aiConfidence = 0.95;

            // when
            Crop crop = Crop.create(cropFilename, bbox, aiPrediction, aiConfidence);

            // then
            assertThat(crop.getCropFilename()).isEqualTo(cropFilename);
            assertThat(crop.getBbox()).isEqualTo(bbox);
            assertThat(crop.getAiPrediction()).isEqualTo(CellType.Lymphocyte);
            assertThat(crop.getAiConfidence()).isEqualTo(0.95);
            assertThat(crop.getId()).isNull();
            assertThat(crop.getTaskId()).isNull();
            assertThat(crop.getFinalLabel()).isNull();
        }
    }
}