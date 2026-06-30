package com.cell.platform.service;

import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.InfraStructureException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final int THUMBNAIL_MAX_DIMENSION = 320;

    private final Path uploadDir;
    private final Path cropDir;
    private final Path thumbnailDir;

    public FileStorageService(
            @Value("${file.upload-dir}") String uploadDir,
            @Value("${file.crop-dir}") String cropDir,
            @Value("${file.thumbnail-dir}") String thumbnailDir) {
        this.uploadDir = Paths.get(uploadDir);
        this.cropDir = Paths.get(cropDir);
        this.thumbnailDir = Paths.get(thumbnailDir);
    }

    @PostConstruct
    void init() {
        createDirectories(uploadDir);
        createDirectories(cropDir);
        createDirectories(thumbnailDir);
    }

    public String saveOriginal(MultipartFile file) {
        String filename = generateFilename(file.getOriginalFilename());
        Path target = uploadDir.resolve(filename);
        saveFile(file, target);
        ensureThumbnail(target, filename);
        return filename;
    }

    public Path getUploadDir() {
        return uploadDir;
    }

    public Path getCropDir() {
        return cropDir;
    }

    public Path getThumbnailDir() {
        return thumbnailDir;
    }

    /**
     * 원본 이미지의 축소판을 thumbnailDir에 생성한다. 이미 존재하면 건너뛴다(원본 업로드 및 백필 양쪽에서 재사용).
     */
    public void ensureThumbnail(Path sourceFile, String filename) {
        Path target = thumbnailDir.resolve(filename);
        if (Files.exists(target)) {
            return;
        }
        try {
            BufferedImage original = ImageIO.read(sourceFile.toFile());
            if (original == null) {
                return;
            }
            int width = original.getWidth();
            int height = original.getHeight();
            double scale = Math.min(1.0, (double) THUMBNAIL_MAX_DIMENSION / Math.max(width, height));
            int targetWidth = Math.max(1, (int) Math.round(width * scale));
            int targetHeight = Math.max(1, (int) Math.round(height * scale));

            BufferedImage thumbnail = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = thumbnail.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(original, 0, 0, targetWidth, targetHeight, null);
            g.dispose();

            ImageIO.write(thumbnail, thumbnailFormat(filename), target.toFile());
        } catch (IOException e) {
            log.warn("썸네일 생성 실패: {}", sourceFile, e);
        }
    }

    private String thumbnailFormat(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".png") ? "png" : "jpg";
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
