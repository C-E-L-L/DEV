package com.cell.platform.controller;

import com.cell.platform.dto.request.CourseworkSaveRequest;
import com.cell.platform.dto.response.CourseworkResponse;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.service.CourseworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/coursework")
@RequiredArgsConstructor
public class CourseworkController {
    private final CourseworkService service;

    @GetMapping("/{id}")
    public CourseworkResponse get(@PathVariable Long id) { return service.get(id); }

    @PutMapping("/{id}")
    public CourseworkResponse save(@PathVariable Long id, @Valid @RequestBody CourseworkSaveRequest request) { return service.save(id, request); }

    @PostMapping("/{id}/publish")
    public CourseworkResponse publish(@PathVariable Long id, @Valid @RequestBody CourseworkSaveRequest request) { return service.publish(id, request); }

    @PostMapping("/{id}/copy")
    public CourseworkResponse copy(@PathVariable Long id) { return service.copy(id); }

    @GetMapping("/data")
    public List<TaskResponse> data() { return service.data(); }
}
