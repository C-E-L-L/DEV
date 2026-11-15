package com.cell.platform.config;

import com.cell.platform.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

/**
 * 기존에 업로드된 원본/진단평가 이미지에 썸네일이 없는 경우, 서버 시작 시
 * 백그라운드에서 일괄 생성한다. 이미 썸네일이 있는 파일은 건너뛰므로
 * 재시작할 때마다 반복 실행해도 안전하다(증분 백필).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ThumbnailBackfillRunner implements CommandLineRunner {

    private final FileStorageService fileStorageService;

    @Value("${diagnostic.dataset.raw-images-dir:../data/diagnostic_gt/raw/images}")
    private String diagnosticRawImagesDir;

    @Override
    public void run(String... args) {
        Thread worker = new Thread(this::backfill, "thumbnail-backfill");
        worker.setDaemon(true);
        worker.start();
    }

    private void backfill() {
        int generated = 0;
        generated += backfillDirectory(fileStorageService.getUploadDir());
        generated += backfillDirectory(Paths.get(diagnosticRawImagesDir));
        if (generated > 0) {
            log.info("썸네일 백필 완료: {}개 생성", generated);
        }
    }

    private int backfillDirectory(Path sourceDir) {
        if (!Files.isDirectory(sourceDir)) {
            return 0;
        }
        int count = 0;
        try (Stream<Path> files = Files.list(sourceDir)) {
            for (Path file : files.filter(Files::isRegularFile).toList()) {
                String filename = file.getFileName().toString();
                if (!isImageFile(filename)) {
                    continue;
                }
                Path thumbnail = fileStorageService.getThumbnailDir().resolve(filename);
                if (Files.exists(thumbnail)) {
                    continue;
                }
                fileStorageService.ensureThumbnail(file, filename);
                count++;
            }
        } catch (IOException e) {
            log.warn("썸네일 백필 중 디렉토리 조회 실패: {}", sourceDir, e);
        }
        return count;
    }

    private boolean isImageFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png");
    }
}
