package com.cell.platform.service;

import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.InfraStructureException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path uploadDir;
    private final Path cropDir;

    public FileStorageService(
            @Value("${file.upload-dir}") String uploadDir,
            @Value("${file.crop-dir}") String cropDir) {
        this.uploadDir = Paths.get(uploadDir);
        this.cropDir = Paths.get(cropDir);
    }

    @PostConstruct
    void init() {
        createDirectories(uploadDir);
        createDirectories(cropDir);
    }

    public String saveOriginal(MultipartFile file) {
        String filename = generateFilename(file.getOriginalFilename());
        saveFile(file, uploadDir.resolve(filename));
        return filename;
    }

    public Path getUploadDir() {
        return uploadDir;
    }

    public Path getCropDir() {
        return cropDir;
    }

    private String generateFilename(String originalName) {
        String ext = extractExtension(originalName);
        return "orig_" + UUID.randomUUID().toString().replace("-", "") + ext;
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf(".");
        return dotIndex > 0 ? filename.substring(dotIndex) : ".jpg";
    }

    private void saveFile(MultipartFile file, Path target) {
        try {
            Files.copy(file.getInputStream(), target);
        } catch (IOException e) {
            throw new InfraStructureException("파일 저장에 실패했습니다.", ErrorCode.G001);
        }
    }

    private void createDirectories(Path path) {
        try {
            Files.createDirectories(path);
        } catch (IOException e) {
            throw new InfraStructureException("디렉토리 생성에 실패했습니다.", ErrorCode.G002);
        }
    }
}
