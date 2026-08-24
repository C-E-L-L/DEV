package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.InfraStructureException;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LabelingService {

    // Frontend CELL_TYPES 순서와 동일하게 유지 (option 번호가 여기서 결정됨)
    private static final List<String> CELL_TYPE_ORDER =
            List.of("Segment", "Band", "Eosinophil", "NucleatedRBC", "Lymphocyte", "Monocyte");

    private final TaskJpaRepository taskJpaRepository;
    private final CropJpaRepository cropJpaRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    // ── Export ──────────────────────────────────────────────────

    public byte[] exportTask(Long taskId) {
        TaskEntity task = findUploadedSmearTask(taskId);
        List<CropEntity> crops = cropJpaRepository.findAllByTask_Id(taskId);
        String speciesCode = speciesCode(task);
        String folder = "task_" + taskId + "_" + speciesCode.toLowerCase() + "/";
        String smearExportName = buildSmearExportName(task);
        Path smearPath = fileStorageService.getUploadDir().resolve(task.getOriginalFilename());

        long fileSize = 0L;
        try {
            fileSize = Files.size(smearPath);
        } catch (IOException ignored) {}

        Map<String, Object> viaJson = buildViaJson(task, crops, smearExportName, fileSize);

        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output)) {
            addFile(zip, smearPath, folder + smearExportName);
            for (CropEntity crop : crops) {
                addFile(zip, fileStorageService.getCropDir().resolve(crop.getCropFilename()),
                        folder + "crops/" + buildCropExportName(task, crop));
            }
            addContent(zip, folder + "annotations.json",
                    objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(viaJson));
            zip.finish();
            return output.toByteArray();
        } catch (IOException e) {
            throw new InfraStructureException("라벨링 내보내기 파일을 생성할 수 없습니다.", ErrorCode.G001);
        }
    }

    private Map<String, Object> buildViaJson(TaskEntity task, List<CropEntity> crops,
                                              String smearExportName, long fileSize) {
        // options: {"1": "Segment", "2": "Band", ...}
        Map<String, String> options = new LinkedHashMap<>();
        for (int i = 0; i < CELL_TYPE_ORDER.size(); i++) {
            options.put(String.valueOf(i + 1), CELL_TYPE_ORDER.get(i));
        }

        List<Map<String, Object>> regions = new ArrayList<>();
        for (CropEntity crop : crops) {
            if (crop.getBbox() == null) continue;
            int[] b = parseBbox(crop.getBbox());

            Map<String, Object> shapeAttrs = new LinkedHashMap<>();
            shapeAttrs.put("name", "rect");
            shapeAttrs.put("x", b[0]);
            shapeAttrs.put("y", b[1]);
            shapeAttrs.put("width", b[2] - b[0]);
            shapeAttrs.put("height", b[3] - b[1]);

            CellType labelToUse = crop.getFinalLabel() != null ? crop.getFinalLabel() : crop.getGtLabel();
            Map<String, Object> checkboxVal = new LinkedHashMap<>();
            if (labelToUse != null) {
                String optionIdx = optionIndex(labelToUse.name());
                if (optionIdx != null) checkboxVal.put(optionIdx, true);
            }

            Map<String, Object> regionAttrs = new LinkedHashMap<>();
            regionAttrs.put("1", checkboxVal);
            regionAttrs.put("cropId", String.valueOf(crop.getId()));

            Map<String, Object> region = new LinkedHashMap<>();
            region.put("shape_attributes", shapeAttrs);
            region.put("region_attributes", regionAttrs);
            regions.add(region);
        }

        String imageKey = smearExportName + fileSize;

        Map<String, Object> imgEntry = new LinkedHashMap<>();
        imgEntry.put("filename", smearExportName);
        imgEntry.put("size", fileSize);
        imgEntry.put("regions", regions);
        Map<String, Object> fileAttributes = new LinkedHashMap<>();
        fileAttributes.put("animalSpeciesId", task.getAnimalSpecies() != null ? task.getAnimalSpecies().getId() : null);
        fileAttributes.put("animalSpeciesCode", speciesCode(task));
        fileAttributes.put("animalSpeciesName", speciesName(task));
        imgEntry.put("file_attributes", fileAttributes);

        Map<String, Object> imgMetadata = new LinkedHashMap<>();
        imgMetadata.put(imageKey, imgEntry);

        // _via_attributes
        Map<String, Object> checkboxAttr = new LinkedHashMap<>();
        checkboxAttr.put("type", "checkbox");
        checkboxAttr.put("description", "");
        checkboxAttr.put("options", options);
        checkboxAttr.put("default_options", Map.of());

        Map<String, Object> cropIdAttr = new LinkedHashMap<>();
        cropIdAttr.put("type", "text");
        cropIdAttr.put("description", "");
        cropIdAttr.put("default_value", "");

        Map<String, Object> regionSchema = new LinkedHashMap<>();
        regionSchema.put("1", checkboxAttr);
        regionSchema.put("cropId", cropIdAttr);

        Map<String, Object> viaAttributes = new LinkedHashMap<>();
        viaAttributes.put("region", regionSchema);
        Map<String, Object> speciesAttr = new LinkedHashMap<>();
        speciesAttr.put("type", "text");
        speciesAttr.put("description", "Animal species");
        speciesAttr.put("default_value", speciesName(task));
        viaAttributes.put("file", Map.of("animalSpeciesName", speciesAttr));

        // _via_settings
        Map<String, Object> uiSettings = new LinkedHashMap<>();
        uiSettings.put("annotation_editor_height", 25);
        uiSettings.put("annotation_editor_fontsize", 0.8);
        uiSettings.put("leftsidebar_width", 18);

        Map<String, Object> coreSettings = new LinkedHashMap<>();
        coreSettings.put("buffer_size", 18);
        coreSettings.put("filepath", Map.of());
        coreSettings.put("default_filepath", "");

        Map<String, Object> projectSettings = new LinkedHashMap<>();
        projectSettings.put("name", "CELL_task_" + task.getId() + "_" + speciesCode(task));

        Map<String, Object> viaSettings = new LinkedHashMap<>();
        viaSettings.put("ui", uiSettings);
        viaSettings.put("core", coreSettings);
        viaSettings.put("project", projectSettings);

        Map<String, Object> via = new LinkedHashMap<>();
        via.put("_via_settings", viaSettings);
        via.put("_via_img_metadata", imgMetadata);
        via.put("_via_attributes", viaAttributes);
        via.put("_via_data_format_version", "2.0.10");
        via.put("_via_image_id_list", List.of(imageKey));
        via.put("_cell_platform_metadata", Map.of(
                "taskId", task.getId(),
                "animalSpeciesCode", speciesCode(task),
                "animalSpeciesName", speciesName(task)
        ));
        return via;
    }

    // ── Import ──────────────────────────────────────────────────

    @Transactional
    public int importLabels(Long taskId, JsonNode viaJson) {
        findUploadedSmearTask(taskId);

        JsonNode imgMetadata = viaJson.get("_via_img_metadata");
        if (imgMetadata == null || !imgMetadata.isObject()) {
            throw new BadRequestException("VIA 형식의 annotations.json이 아닙니다.", ErrorCode.G000);
        }

        Map<Long, CropEntity> cropsById = new HashMap<>();
        cropJpaRepository.findAllByTask_Id(taskId).forEach(crop -> cropsById.put(crop.getId(), crop));

        int updated = 0;
        for (JsonNode imgEntry : imgMetadata) {
            JsonNode regions = imgEntry.get("regions");
            if (regions == null) continue;

            for (JsonNode region : regions) {
                JsonNode regionAttrs = region.get("region_attributes");
                if (regionAttrs == null) continue;

                // cropId로 어떤 crop인지 특정
                JsonNode cropIdNode = regionAttrs.get("cropId");
                if (cropIdNode == null || cropIdNode.asText().isBlank()) continue;
                Long cropId;
                try {
                    cropId = Long.parseLong(cropIdNode.asText().trim());
                } catch (NumberFormatException e) {
                    continue;
                }

                CropEntity crop = cropsById.get(cropId);
                if (crop == null) {
                    throw new BadRequestException(
                            "이 과제에 속하지 않은 cropId입니다: " + cropId, ErrorCode.G000);
                }

                // checkbox attribute "1"에서 선택된 option 추출
                JsonNode checkboxAttr = regionAttrs.get("1");
                if (checkboxAttr == null || !checkboxAttr.isObject()) continue;

                String selectedLabel = null;
                Iterator<Map.Entry<String, JsonNode>> fields = checkboxAttr.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> entry = fields.next();
                    if (entry.getValue().asBoolean(false)) {
                        int idx = Integer.parseInt(entry.getKey()) - 1;
                        if (idx >= 0 && idx < CELL_TYPE_ORDER.size()) {
                            selectedLabel = CELL_TYPE_ORDER.get(idx);
                        }
                        break;
                    }
                }

                if (selectedLabel == null) continue;
                CellType label = parseCellType(selectedLabel);
                crop.updateGtLabel(label);
                crop.updateFinalLabel(label);
                updated++;
            }
        }
        return updated;
    }

    // ── Helpers ─────────────────────────────────────────────────

    private TaskEntity findUploadedSmearTask(Long taskId) {
        TaskEntity task = taskJpaRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException(
                        "과제(Task)를 찾을 수 없습니다. taskId=" + taskId, ErrorCode.T000));
        if (!hasText(task.getOriginalFilename())
                || (task.getUploadedFilename() != null
                    && task.getUploadedFilename().startsWith("diagnostic-"))) {
            throw new BadRequestException("도말 업로드 과제만 라벨링 파일로 내보낼 수 있습니다.", ErrorCode.G000);
        }
        return task;
    }

    private String buildSmearExportName(TaskEntity task) {
        String filename = hasText(task.getUploadedFilename())
                ? task.getUploadedFilename()
                : task.getOriginalFilename();
        return "task_" + task.getId() + "_" + speciesCode(task).toLowerCase()
                + "_smear_" + sanitizeFilename(filename);
    }

    private String buildCropExportName(TaskEntity task, CropEntity crop) {
        return "task_" + task.getId() + "_" + speciesCode(task).toLowerCase()
                + "_cell_" + crop.getId() + ".jpg";
    }

    public String buildArchiveFilename(Long taskId) {
        TaskEntity task = findUploadedSmearTask(taskId);
        return "task_" + taskId + "_" + speciesCode(task).toLowerCase() + "_labeling.zip";
    }

    private String speciesCode(TaskEntity task) {
        return task.getAnimalSpecies() != null
                ? task.getAnimalSpecies().getCode()
                : AnimalSpeciesService.DOG_CODE;
    }

    private String speciesName(TaskEntity task) {
        return task.getAnimalSpecies() != null
                ? task.getAnimalSpecies().getName()
                : "개 (Dog)";
    }

    private String sanitizeFilename(String filename) {
        String baseName = Path.of(filename).getFileName().toString();
        String safeName = baseName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        return safeName.isBlank() ? "image.jpg" : safeName;
    }

    /** bbox 문자열 "[x1, y1, x2, y2]" 또는 "[[x1, y1], [x2, y2]]" → int[4] */
    private int[] parseBbox(String bbox) {
        String cleaned = bbox.replaceAll("[\\[\\]'\\s]", "");
        String[] parts = cleaned.split(",");
        return new int[]{
                (int) Double.parseDouble(parts[0]),
                (int) Double.parseDouble(parts[1]),
                (int) Double.parseDouble(parts[2]),
                (int) Double.parseDouble(parts[3])
        };
    }

    private String optionIndex(String cellTypeName) {
        int idx = CELL_TYPE_ORDER.indexOf(cellTypeName);
        return idx >= 0 ? String.valueOf(idx + 1) : null;
    }

    private CellType parseCellType(String label) {
        try {
            return CellType.valueOf(label);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("유효하지 않은 셀 타입입니다: " + label, ErrorCode.C001);
        }
    }

    private void addFile(ZipOutputStream zip, Path source, String entryName) throws IOException {
        if (!Files.exists(source)) {
            throw new InfraStructureException(
                    "라벨링 이미지 파일을 찾을 수 없습니다: " + source, ErrorCode.G001);
        }
        zip.putNextEntry(new ZipEntry(entryName));
        Files.copy(source, zip);
        zip.closeEntry();
    }

    private void addContent(ZipOutputStream zip, String entryName, byte[] content) throws IOException {
        zip.putNextEntry(new ZipEntry(entryName));
        zip.write(content);
        zip.closeEntry();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
