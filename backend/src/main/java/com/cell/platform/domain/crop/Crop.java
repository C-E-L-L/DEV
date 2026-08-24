package com.cell.platform.domain.crop;

import lombok.Builder;
import lombok.Getter;

@Getter
public class Crop {

    private Long id;
    private Long taskId;
    private String originalSmearFilename;
    private Long speciesId;
    private String speciesCode;
    private String speciesName;
    private String cropFilename;
    private String bbox;
    private CellType gtLabel;
    private CellType pseudoLabel;
    private Double aiBboxConfidence;
    private Double aiClassificationConfidence;
    private CellType finalLabel;

    @Builder
    public Crop(Long id, Long taskId, String originalSmearFilename,
                Long speciesId, String speciesCode, String speciesName,
                String cropFilename, String bbox,
                CellType gtLabel, CellType pseudoLabel,
                Double aiBboxConfidence, Double aiClassificationConfidence,
                CellType finalLabel) {
        this.id = id;
        this.taskId = taskId;
        this.originalSmearFilename = originalSmearFilename;
        this.speciesId = speciesId;
        this.speciesCode = speciesCode;
        this.speciesName = speciesName;
        this.cropFilename = cropFilename;
        this.bbox = bbox;
        this.gtLabel = gtLabel;
        this.pseudoLabel = pseudoLabel;
        this.aiBboxConfidence = aiBboxConfidence;
        this.aiClassificationConfidence = aiClassificationConfidence;
        this.finalLabel = finalLabel;
    }

    public static Crop create(String cropFilename, String bbox,
                              CellType gtLabel, CellType pseudoLabel,
                              Double aiBboxConfidence, Double aiClassificationConfidence) {
        return Crop.builder()
                .cropFilename(cropFilename)
                .bbox(bbox)
                .gtLabel(gtLabel)
                .pseudoLabel(pseudoLabel)
                .aiBboxConfidence(aiBboxConfidence)
                .aiClassificationConfidence(aiClassificationConfidence)
                .finalLabel(gtLabel)
                .build();
    }
}
