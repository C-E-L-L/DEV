package com.cell.platform.service;

import com.cell.platform.dto.response.AnimalSpeciesResponse;
import com.cell.platform.entity.AnimalSpeciesEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.species.AnimalSpeciesJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnimalSpeciesService {

    public static final String DOG_CODE = "DOG";
    public static final String CAT_CODE = "CAT";

    private final AnimalSpeciesJpaRepository speciesRepository;
    private final TaskJpaRepository taskRepository;

    public List<AnimalSpeciesResponse> getAll() {
        return speciesRepository.findAllByOrderByBuiltInDescNameAsc().stream()
                .map(AnimalSpeciesResponse::from)
                .toList();
    }

    public AnimalSpeciesEntity getRequired(Long speciesId) {
        return speciesRepository.findById(speciesId)
                .orElseThrow(() -> new NotFoundException(
                        "동물 종을 찾을 수 없습니다. speciesId=" + speciesId, ErrorCode.G000));
    }

    public AnimalSpeciesEntity getDog() {
        return speciesRepository.findByCode(DOG_CODE)
                .orElseThrow(() -> new NotFoundException("기본 동물 종(Dog)이 없습니다.", ErrorCode.G000));
    }

    @Transactional
    public AnimalSpeciesResponse create(String rawName) {
        String name = normalizeName(rawName);
        ensureUniqueName(name, null);
        AnimalSpeciesEntity saved = speciesRepository.save(AnimalSpeciesEntity.builder()
                .code("ANIMAL_" + UUID.randomUUID().toString().replace("-", "")
                        .substring(0, 12).toUpperCase(Locale.ROOT))
                .name(name)
                .builtIn(false)
                .build());
        return AnimalSpeciesResponse.from(saved);
    }

    @Transactional
    public AnimalSpeciesResponse rename(Long speciesId, String rawName) {
        AnimalSpeciesEntity species = getRequired(speciesId);
        String name = normalizeName(rawName);
        ensureUniqueName(name, speciesId);
        species.rename(name);
        return AnimalSpeciesResponse.from(species);
    }

    @Transactional
    public AnimalSpeciesResponse updateTaskSpecies(Long taskId, Long speciesId) {
        TaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException(
                        "도말 이미지를 찾을 수 없습니다. taskId=" + taskId, ErrorCode.T000));
        AnimalSpeciesEntity species = getRequired(speciesId);
        task.updateAnimalSpecies(species);
        return AnimalSpeciesResponse.from(species);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeDefaultsAndBackfill() {
        AnimalSpeciesEntity dog = speciesRepository.findByCode(DOG_CODE)
                .orElseGet(() -> speciesRepository.save(AnimalSpeciesEntity.builder()
                        .code(DOG_CODE)
                        .name("개 (Dog)")
                        .builtIn(true)
                        .build()));
        speciesRepository.findByCode(CAT_CODE)
                .orElseGet(() -> speciesRepository.save(AnimalSpeciesEntity.builder()
                        .code(CAT_CODE)
                        .name("고양이 (Cat)")
                        .builtIn(true)
                        .build()));

        taskRepository.findAllByAnimalSpeciesIsNull()
                .forEach(task -> task.updateAnimalSpecies(dog));
    }

    private String normalizeName(String rawName) {
        if (rawName == null) {
            throw new BadRequestException("동물 종 이름은 필수입니다.", ErrorCode.G000);
        }
        String normalized = rawName.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            throw new BadRequestException("동물 종 이름은 필수입니다.", ErrorCode.G000);
        }
        if (normalized.length() > 60) {
            throw new BadRequestException("동물 종 이름은 60자 이하여야 합니다.", ErrorCode.G000);
        }
        return normalized;
    }

    private void ensureUniqueName(String name, Long currentId) {
        speciesRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (currentId == null || !existing.getId().equals(currentId)) {
                throw new BadRequestException("이미 등록된 동물 종입니다: " + name, ErrorCode.G000);
            }
        });
    }
}
