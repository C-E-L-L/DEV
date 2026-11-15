package com.cell.platform.controller;
import com.cell.platform.service.CalibrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/professor/calibration")
@RequiredArgsConstructor
public class CalibrationController {
    private final CalibrationService service;
    @GetMapping
    public CalibrationService.CalibrationResponse get(@RequestParam(required=false) Long speciesId,
            @RequestParam(defaultValue="INITIAL") String source, @RequestParam(required=false) String schema) { return service.get(speciesId,source,schema); }
}
