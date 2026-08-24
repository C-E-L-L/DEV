package com.cell.platform.infra.species;

import com.cell.platform.entity.AnimalSpeciesEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnimalSpeciesJpaRepository extends JpaRepository<AnimalSpeciesEntity, Long> {

    Optional<AnimalSpeciesEntity> findByCode(String code);

    Optional<AnimalSpeciesEntity> findByNameIgnoreCase(String name);

    List<AnimalSpeciesEntity> findAllByOrderByBuiltInDescNameAsc();
}
