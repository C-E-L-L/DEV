package com.cell.platform.service;

import com.cell.platform.domain.task.TaskKind;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.infra.species.AnimalSpeciesJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class LabelingExportIntegrationTest {
    @Autowired LabelingService labeling;
    @Autowired FileStorageService files;
    @Autowired TaskJpaRepository tasks;
    @Autowired AnimalSpeciesJpaRepository species;
    @Autowired MockMvc mvc;
    private final List<Path> created = new ArrayList<>();

    @AfterEach
    void removeFiles() throws IOException {
        for (Path path : created) Files.deleteIfExists(path);
    }

    @Test
    void severalSmearsAreExportedIntoOneArchiveWithAFolderEach() throws Exception {
        TaskEntity first = smear("export-test-a");
        TaskEntity second = smear("export-test-b");

        List<String> entries = entryNames(labeling.exportTasks(List.of(first.getId(), second.getId(), first.getId())));

        for (TaskEntity task : List.of(first, second)) {
            String folder = "task_" + task.getId() + "_dog/";
            assertThat(entries).contains(folder + "annotations.json");
            assertThat(entries.stream().filter(name -> name.startsWith(folder + "crops/"))).hasSize(1);
        }
        assertThat(entries).hasSize(6); // per smear: image, one crop, annotations.json; the repeated id is ignored
        assertThat(entryNames(labeling.exportTask(first.getId()))).hasSize(3);
        assertThatThrownBy(() -> labeling.exportTasks(List.of())).hasMessageContaining("선택");
    }

    @Test
    void exportEndpointIsLimitedToProfessors() throws Exception {
        TaskEntity task = smear("export-test-c");
        String body = "{\"taskIds\":[" + task.getId() + "]}";
        mvc.perform(post("/api/labeling/tasks/export").with(role("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/labeling/tasks/export").with(role("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"cell_labeling_export.zip\""));
    }

    private TaskEntity smear(String name) throws IOException {
        Path image = files.getUploadDir().resolve(name + ".png");
        Path crop = files.getCropDir().resolve(name + "-cell.png");
        for (Path path : List.of(image, crop)) {
            Files.createDirectories(path.getParent());
            Files.write(path, new byte[]{1, 2, 3});
            created.add(path);
        }
        var task = TaskEntity.builder().kind(TaskKind.PRACTICE).status(TaskStatus.DRAFT).title("내보내기 시험")
                .originalFilename(name + ".png").uploadedFilename(name + "-upload.png")
                .animalSpecies(species.findByCode("DOG").orElseThrow()).build();
        task.addCrop(CropEntity.builder().cropFilename(name + "-cell.png").bbox("[0,0,10,10]").build());
        return tasks.saveAndFlush(task);
    }

    private List<String> entryNames(byte[] zip) throws IOException {
        List<String> names = new ArrayList<>();
        try (ZipInputStream input = new ZipInputStream(new ByteArrayInputStream(zip))) {
            for (ZipEntry entry = input.getNextEntry(); entry != null; entry = input.getNextEntry()) names.add(entry.getName());
        }
        return names;
    }

    private RequestPostProcessor role(String role) {
        return authentication(new UsernamePasswordAuthenticationToken("user", null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }
}
