package com.cell.platform.dto.response;

import com.cell.platform.entity.AnimalSpeciesEntity;

public record AnimalSpeciesResponse(
        Long id,
        String code,
        String name,
        boolean builtIn
) {
    public static AnimalSpeciesResponse from(AnimalSpeciesEntity entity) {
        return new AnimalSpeciesResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.isBuiltIn()
        );
    }
}
