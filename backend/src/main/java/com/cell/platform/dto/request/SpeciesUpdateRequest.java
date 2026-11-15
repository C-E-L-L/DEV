package com.cell.platform.dto.request;

import jakarta.validation.constraints.NotNull;

public record SpeciesUpdateRequest(
        @NotNull(message = "동물 종은 필수입니다.")
        Long speciesId
) {
}
