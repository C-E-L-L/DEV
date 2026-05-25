package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.dto.request.LabelingImportRequest;
import com.cell.platform.dto.response.LabelingManifestResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.InfraStructureException;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LabelingService {

    private final TaskJpaRepository taskJpaRepository;
    private final CropJpaRepository cropJpaRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public byte[] exportTask(Long taskId) {
        TaskEntity task = findUploadedSmearTask(taskId);
        List<CropEntity> crops = cropJpaRepository.findAllByTask_Id(taskId);
        String folder = "task_" + taskId + "/";
        String smearExportName = buildSmearExportName(task);
        LabelingManifestResponse manifest = buildManifest(task, crops, smearExportName);

        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output)) {
            addFile(zip, fileStorageService.getUploadDir().resolve(task.getOriginalFilename()),
                    folder + smearExportName);
            for (CropEntity crop : crops) {
                addFile(zip, fileStorageService.getCropDir().resolve(crop.getCropFilename()),
                        folder + "crops/" + buildCropExportName(taskId, crop));
            }
            addContent(zip, folder + "annotations.json",
                    objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(manifest));
            zip.finish();
            return output.toByteArray();
        } catch (IOException e) {
            throw new InfraStructureException("라벨링 내보내기 파일을 생성할 수 없습니다.", ErrorCode.G001);
        }
    }

    @Transactional
    public int importLabels(Long taskId, LabelingImportRequest request) {
        findUploadedSmearTask(taskId);
        if (request == null || request.cells() == null || request.cells().isEmpty()) {
            throw new BadRequestException("반영할 세포 라벨이 없습니다.", ErrorCode.G000);
        }
        if (request.taskId() != null && !taskId.equals(request.taskId())) {
            throw new BadRequestException("JSON의 taskId가 선택한 과제와 일치하지 않습니다.", ErrorCode.G000);
        }

        Map<Long, CropEntity> cropsById = new HashMap<>();
        cropJpaRepository.findAllByTask_Id(taskId).forEach(crop -> cropsById.put(crop.getId(), crop));
        int updated = 0;
        for (LabelingImportRequest.CellLabel imported : request.cells()) {
            if (imported.cropId() == null) {
                continue;
            }
            CropEntity crop = cropsById.get(imported.cropId());
            if (crop == null) {
                throw new BadRequestException("이 과제에 속하지 않은 cropId입니다: " + imported.cropId(), ErrorCode.G000);
            }
            String importedLabel = hasText(imported.finalLabel()) ? imported.finalLabel() : imported.gtLabel();
            if (!hasText(importedLabel)) {
                continue;
            }
            CellType label = parseCellType(importedLabel);
            crop.updateGtLabel(label);
            crop.updateFinalLabel(label);
            updated++;
        }
        return updated;
    }

    private LabelingManifestResponse buildManifest(
            TaskEntity task,
            List<CropEntity> crops,
            String smearExportName
    ) {
        List<LabelingManifestResponse.CellAnnotation> annotations = crops.stream()
                .map(crop -> new LabelingManifestResponse.CellAnnotation(
                        crop.getId(),
                        "crops/" + buildCropExportName(task.getId(), crop),
                        crop.getCropFilename(),
                        crop.getBbox(),
                        crop.getGtLabel() != null ? crop.getGtLabel().name() : null,
                        crop.getFinalLabel() != null ? crop.getFinalLabel().name() : null
                ))
                .toList();
        return new LabelingManifestResponse(
                task.getId(),
                task.getUploadedFilename(),
                task.getOriginalFilename(),
                smearExportName,
                annotations
        );
    }

    private TaskEntity findUploadedSmearTask(Long taskId) {
        TaskEntity task = taskJpaRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException(
                        "과제(Task)를 찾을 수 없습니다. taskId=" + taskId, ErrorCode.T000));
        if (!hasText(task.getOriginalFilename())
                || (task.getUploadedFilename() != null && task.getUploadedFilename().startsWith("diagnostic-"))) {
            throw new BadRequestException("도말 업로드 과제만 라벨링 파일로 내보낼 수 있습니다.", ErrorCode.G000);
        }
        return task;
    }

    private String buildSmearExportName(TaskEntity task) {
        String filename = hasText(task.getUploadedFilename())
                ? task.getUploadedFilename()
                : task.getOriginalFilename();
        return "task_" + task.getId() + "_smear_" + sanitizeFilename(filename);
    }

    private String buildCropExportName(Long taskId, CropEntity crop) {
        return "task_" + taskId + "_cell_" + crop.getId() + ".jpg";
    }

    private String sanitizeFilename(String filename) {
        String baseName = Path.of(filename).getFileName().toString();
        String safeName = baseName.replaceAll("[^\\p{L}\\p{N}._-]+", "_");
        return safeName.isBlank() ? "image.jpg" : safeName;
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
            throw new InfraStructureException("라벨링 이미지 파일을 찾을 수 없습니다: " + source, ErrorCode.G001);
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
