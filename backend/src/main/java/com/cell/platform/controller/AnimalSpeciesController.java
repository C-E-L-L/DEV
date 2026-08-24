package com.cell.platform.controller;

import com.cell.platform.dto.request.AnimalSpeciesNameRequest;
import com.cell.platform.dto.response.AnimalSpeciesResponse;
import com.cell.platform.service.AnimalSpeciesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/species")
@RequiredArgsConstructor
public class AnimalSpeciesController {

    private final AnimalSpeciesService speciesService;

    @GetMapping
    public ResponseEntity<List<AnimalSpeciesResponse>> getAll() {
        return ResponseEntity.ok(speciesService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<AnimalSpeciesResponse> create(
            @Valid @RequestBody AnimalSpeciesNameRequest request) {
        return ResponseEntity.ok(speciesService.create(request.name()));
    }

    @PutMapping("/{speciesId}")
    @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
    public ResponseEntity<AnimalSpeciesResponse> rename(
            @PathVariable Long speciesId,
            @Valid @RequestBody AnimalSpeciesNameRequest request) {
        return ResponseEntity.ok(speciesService.rename(speciesId, request.name()));
    }
}
