package com.cell.platform.infra.species;
import com.cell.platform.entity.CellClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CellClassJpaRepository extends JpaRepository<CellClassEntity,Long> {
    List<CellClassEntity> findAllBySpeciesIdOrderByIdAsc(Long speciesId);
    boolean existsBySpeciesIdAndCode(Long speciesId,String code);
}
