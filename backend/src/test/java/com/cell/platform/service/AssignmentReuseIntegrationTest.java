package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.task.TaskKind;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.infra.species.AnimalSpeciesJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** A practice coursework built from smears that are already on the server (no upload, no AI call). */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AssignmentReuseIntegrationTest {
    @Autowired TaskJpaRepository tasks;
    @Autowired AnimalSpeciesJpaRepository species;
    @Autowired MockMvc mvc;

    @Test
    void serverSmearsBecomeDraftsOfOneNewCourseworkAndTheSourcesStayUntouched() throws Exception {
        TaskEntity published = smear("reuse-a.png", TaskStatus.IN_PROGRESS, "지난 실습");
        TaskEntity draft = smear("reuse-b.png", TaskStatus.DRAFT, "준비 중");

        mvc.perform(multipart("/api/assignments").param("title", "2주차 분류 실습")
                        .param("sourceTaskIds", published.getId().toString(), draft.getId().toString(), published.getId().toString())
                        .with(role("EXPERT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks.length()").value(2)) // the repeated id is ignored
                .andExpect(jsonPath("$.totalCrops").value(4));

        List<TaskEntity> created = tasks.findAll().stream().filter(task -> "2주차 분류 실습".equals(task.getTitle())).toList();
        assertThat(created).hasSize(2);
        assertThat(created).allSatisfy(task -> {
            assertThat(task.getStatus()).isEqualTo(TaskStatus.DRAFT);
            assertThat(task.getKind()).isEqualTo(TaskKind.PRACTICE);
            assertThat(task.getAssignmentId()).isNotNull().isEqualTo(created.get(0).getAssignmentId());
            assertThat(task.getCrops()).hasSize(2);
            // Confirmed answers and exclusions come along, as new rows.
            assertThat(task.getCrops()).extracting(CropEntity::getFinalLabel).containsExactly(CellType.Segment, null);
            assertThat(task.getCrops()).extracting(CropEntity::isExcluded).containsExactly(false, true);
        });
        assertThat(created).extracting(TaskEntity::getOriginalFilename).containsExactlyInAnyOrder("reuse-a.png", "reuse-b.png");
        assertThat(published.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(published.getTitle()).isEqualTo("지난 실습");
        assertThat(published.getCrops()).hasSize(2).doesNotContainAnyElementsOf(created.get(0).getCrops());
    }

    @Test
    void aCourseworkNeedsAtLeastOneSmearAndOnlyUploadedSmearsCanBeReused() throws Exception {
        mvc.perform(multipart("/api/assignments").param("title", "빈 과제").with(role("EXPERT")))
                .andExpect(status().isBadRequest());

        TaskEntity diagnostic = tasks.saveAndFlush(TaskEntity.builder().kind(TaskKind.DIAGNOSTIC).status(TaskStatus.IN_PROGRESS)
                .title("진단평가").originalFilename("").uploadedFilename("diagnostic-1")
                .animalSpecies(species.findByCode("DOG").orElseThrow()).build());
        mvc.perform(multipart("/api/assignments").param("title", "진단평가 재사용")
                        .param("sourceTaskIds", diagnostic.getId().toString()).with(role("EXPERT")))
                .andExpect(status().isBadRequest());

        TaskEntity source = smear("reuse-c.png", TaskStatus.DRAFT, "자료");
        mvc.perform(multipart("/api/assignments").param("title", "학생 요청")
                        .param("sourceTaskIds", source.getId().toString()).with(role("STUDENT")))
                .andExpect(status().isForbidden());
    }

    private TaskEntity smear(String filename, TaskStatus status, String title) {
        TaskEntity task = TaskEntity.builder().kind(TaskKind.PRACTICE).status(status).title(title)
                .originalFilename(filename).uploadedFilename("upload-" + filename)
                .animalSpecies(species.findByCode("DOG").orElseThrow()).build();
        task.addCrop(CropEntity.builder().cropFilename(filename + "-1.png").bbox("[0,0,10,10]").finalLabel(CellType.Segment).build());
        task.addCrop(CropEntity.builder().cropFilename(filename + "-2.png").bbox("[10,10,20,20]").excluded(true).exclusionReason("흐림").build());
        return tasks.saveAndFlush(task);
    }

    private RequestPostProcessor role(String role) {
        return authentication(new UsernamePasswordAuthenticationToken("user", null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }
}
