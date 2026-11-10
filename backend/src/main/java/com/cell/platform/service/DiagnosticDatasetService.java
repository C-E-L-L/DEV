package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.InfraStructureException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiagnosticDatasetService {

    private final ObjectMapper objectMapper;

    @Value("${diagnostic.dataset.processed-dir:../data/diagnostic_gt/processed}")
    private String processedDir;

    public Map<CellType, Integer> getAvailableCounts() {
        return getAvailableCounts("DOG");
    }

    public Map<CellType, Integer> getAvailableCounts(String speciesCode) {
        List<DiagnosticCell> cells = loadCells().stream().filter(c -> c.speciesCode().equals(speciesCode)).toList();
        Map<CellType, Long> grouped = cells.stream()
                .collect(Collectors.groupingBy(DiagnosticCell::label, Collectors.counting()));

        Map<CellType, Integer> result = new LinkedHashMap<>();
        for (CellType type : CellType.values()) {
            result.put(type, grouped.getOrDefault(type, 0L).intValue());
        }
        grouped.forEach((type, count) -> result.putIfAbsent(type, count.intValue()));
        return result;
    }

    public List<DiagnosticCell> sampleCells(Map<CellType, Integer> distribution) {
        return sampleCells(distribution, "DOG");
    }

    public List<DiagnosticCell> sampleCells(Map<CellType, Integer> distribution, String speciesCode) {
        List<DiagnosticCell> cells = loadCells().stream().filter(c -> c.speciesCode().equals(speciesCode)).toList();
        Map<CellType, List<DiagnosticCell>> grouped = cells.stream()
                .collect(Collectors.groupingBy(DiagnosticCell::label));

        List<DiagnosticCell> selected = new ArrayList<>();
        for (Map.Entry<CellType, Integer> entry : distribution.entrySet()) {
            CellType type = entry.getKey();
            int requested = entry.getValue();
            if (requested <= 0) {
                continue;
            }

            List<DiagnosticCell> candidates = new ArrayList<>(grouped.getOrDefault(type, List.of()));
            if (candidates.size() < requested) {
                throw new InfraStructureException(
                        "진단 데이터셋의 " + type.name() + " 샘플이 부족합니다. 요청=" + requested + ", 보유=" + candidates.size(),
                        ErrorCode.G001
                );
            }

            Collections.shuffle(candidates);
            selected.addAll(candidates.subList(0, requested));
        }
        Collections.shuffle(selected);
        return selected;
    }

    public Optional<CellType> findLabelByCropFilename(String cropFilename) {
        if (cropFilename == null || cropFilename.isBlank()) {
            return Optional.empty();
        }
        return loadCells().stream()
                .filter(cell -> cropFilename.equals(cell.cropFilename()))
                .map(DiagnosticCell::label)
                .findFirst();
    }

    private List<DiagnosticCell> loadCells() {
        Path manifestPath = Paths.get(processedDir).resolve("manifest.json").toAbsolutePath().normalize();
        if (!Files.exists(manifestPath)) return List.of();
        try {
            JsonNode root = objectMapper.readTree(manifestPath.toFile());
            if (!root.isArray()) {
                throw new InfraStructureException("진단 데이터셋 manifest 포맷이 올바르지 않습니다.", ErrorCode.G001);
            }

            List<DiagnosticCell> result = new ArrayList<>();
            for (JsonNode node : root) {
                String cropFilename = node.path("cropFilename").asText(null);
                String labelText = node.path("label").asText(null);
                JsonNode bboxNode = node.path("bbox");
                if (cropFilename == null || labelText == null || !bboxNode.isArray()) {
                    continue;
                }

                CellType label = CellType.valueOf(labelText);
                Path rootDir = manifestPath.getParent().resolve("crops").normalize();
                Path cropPath = rootDir.resolve(cropFilename).normalize();
                if (!cropPath.startsWith(rootDir) || !Files.isRegularFile(cropPath)) continue;
                String bbox = bboxNode.toString();
                String speciesCode = node.path("speciesCode").asText("DOG");
                result.add(new DiagnosticCell(cropFilename, label, bbox, speciesCode));
            }
            // One source image must not be sampled twice in a diagnostic.
            Map<String, DiagnosticCell> unique = new LinkedHashMap<>();
            for (DiagnosticCell cell : result) {
                DiagnosticCell prior = unique.putIfAbsent(cell.cropFilename(), cell);
                if (prior != null && (prior.label() != cell.label() || !prior.speciesCode().equals(cell.speciesCode()))) {
                    throw new IllegalArgumentException("Conflicting diagnostic labels: " + cell.cropFilename());
                }
            }
            return new ArrayList<>(unique.values());
        } catch (IllegalArgumentException e) {
            throw new InfraStructureException("진단 데이터셋 클래스 매핑이 유효하지 않습니다.", ErrorCode.G001);
        } catch (IOException e) {
            throw new InfraStructureException("진단 데이터셋 manifest 파일을 읽을 수 없습니다: " + manifestPath, ErrorCode.G001);
        }
    }

    public record DiagnosticCell(
            String cropFilename,
            CellType label,
            String bbox,
            String speciesCode
    ) {
        public DiagnosticCell(String cropFilename, CellType label, String bbox) {
            this(cropFilename, label, bbox, "DOG");
        }
    }
}
