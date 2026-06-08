package com.cell.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.crop-dir}")
    private String cropDir;

    @Value("${file.thumbnail-dir}")
    private String thumbnailDir;

    @Value("${diagnostic.dataset.processed-dir:../data/diagnostic_gt/processed}")
    private String diagnosticProcessedDir;

    @Value("${diagnostic.dataset.raw-images-dir:../data/diagnostic_gt/raw/images}")
    private String diagnosticRawImagesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absUpload = Paths.get(uploadDir).toAbsolutePath().normalize().toString();
        String absCrop = Paths.get(cropDir).toAbsolutePath().normalize().toString();
        String absThumbnail = Paths.get(thumbnailDir).toAbsolutePath().normalize().toString();
        String localUpload = Paths.get("data", "originals").toAbsolutePath().normalize().toString();
        String localCrop = Paths.get("data", "crops").toAbsolutePath().normalize().toString();
        String localThumbnail = Paths.get("data", "thumbnails").toAbsolutePath().normalize().toString();
        String sharedUpload = Paths.get("..", "data", "originals").toAbsolutePath().normalize().toString();
        String sharedCrop = Paths.get("..", "data", "crops").toAbsolutePath().normalize().toString();
        String sharedThumbnail = Paths.get("..", "data", "thumbnails").toAbsolutePath().normalize().toString();
        String diagnosticCrop = Paths.get(diagnosticProcessedDir, "crops").toAbsolutePath().normalize().toString();
        String diagnosticRaw = Paths.get(diagnosticRawImagesDir).toAbsolutePath().normalize().toString();

        registry.addResourceHandler("/data/originals/**")
                .addResourceLocations(
                        "file:" + absUpload + "/",
                        "file:" + localUpload + "/",
                        "file:" + sharedUpload + "/",
                        "file:" + diagnosticRaw + "/"
                );

        registry.addResourceHandler("/data/crops/**")
                .addResourceLocations(
                        "file:" + diagnosticCrop + "/",
                        "file:" + absCrop + "/",
                        "file:" + localCrop + "/",
                        "file:" + sharedCrop + "/"
                );

        registry.addResourceHandler("/data/thumbnails/**")
                .addResourceLocations(
                        "file:" + absThumbnail + "/",
                        "file:" + localThumbnail + "/",
                        "file:" + sharedThumbnail + "/"
                );
    }
}
