package com.cell.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnimalSpeciesNameRequest(
        @NotBlank(message = "동물 종 이름은 필수입니다.")
        @Size(max = 60, message = "동물 종 이름은 60자 이하여야 합니다.")
        String name
) {
}
