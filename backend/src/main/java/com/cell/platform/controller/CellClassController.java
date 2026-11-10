package com.cell.platform.controller;
import com.cell.platform.entity.CellClassEntity;
import com.cell.platform.service.CellClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequiredArgsConstructor
@RequestMapping("/api/species/{speciesId}/classes")
@PreAuthorize("hasAnyRole('EXPERT','ADMIN')")
public class CellClassController {
    private final CellClassService service;
    public record ClassRequest(String code,String name,boolean active) {}
    @GetMapping public List<CellClassEntity> list(@PathVariable Long speciesId) { return service.list(speciesId); }
    @PostMapping public CellClassEntity create(@PathVariable Long speciesId,@RequestBody ClassRequest req) { return service.create(speciesId,req.code(),req.name()); }
    @PutMapping("/{id}") public CellClassEntity update(@PathVariable Long speciesId,@PathVariable Long id,@RequestBody ClassRequest req) { return service.update(speciesId,id,req.name(),req.active()); }
}
