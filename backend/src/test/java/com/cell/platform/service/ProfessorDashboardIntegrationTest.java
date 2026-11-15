package com.cell.platform.service;

import com.cell.platform.domain.task.TaskKind;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.dto.request.CourseworkSaveRequest;
import com.cell.platform.dto.request.CropIssueReportRequest;
import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.request.StudentRosterImportRequest;
import com.cell.platform.dto.request.StudentRosterImportRequest.Row;
import com.cell.platform.dto.response.ProfessorActivityResponse.Event;
import com.cell.platform.dto.response.ProfessorProgressResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.infra.species.AnimalSpeciesJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import jakarta.persistence.EntityManager;
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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfessorDashboardIntegrationTest {
    @Autowired ProfessorDashboardService dashboard;
    @Autowired CourseworkService coursework;
    @Autowired SubmissionService submissions;
    @Autowired CropIssueReportService reportService;
    @Autowired AdminService accounts;
    @Autowired TaskJpaRepository tasks;
    @Autowired AnimalSpeciesJpaRepository species;
    @Autowired EntityManager em;
    @Autowired MockMvc mvc;

    @Test
    void progressCountsFinalSubmissionsOfPublishedCourseworkOnly() {
        accounts.createUser(new RegisterRequest("s1", "김학생", "password123", "STUDENT"));
        accounts.createUser(new RegisterRequest("s2", "이학생", "password123", "STUDENT"));
        accounts.importStudentRoster(new StudentRosterImportRequest(List.of(
                new Row("s1", "명단이름", "A반"), new Row("s9", "미가입", "B반"))), "prof");
        TaskEntity published = draft();
        TaskEntity unpublished = draft();
        coursework.publish(published.getId(), request(published.getId(), "Band"));
        Long cropA = published.getCrops().get(0).getId(), cropB = published.getCrops().get(1).getId();
        submissions.submit(cropA, "s1", "Band");
        submissions.submit(cropB, "s1", "Band");
        submissions.finalizeAttempt(published.getId(), "s1");
        submissions.submit(cropA, "s2", "Band"); // autosaved answer, not a final submission
        em.flush(); em.clear();

        ProfessorProgressResponse progress = dashboard.getProgress();

        assertThat(progress.students()).extracting(ProfessorProgressResponse.Student::studentId).contains("s1", "s2", "s9");
        var s1 = progress.students().stream().filter(s -> s.studentId().equals("s1")).findFirst().orElseThrow();
        assertThat(s1.name()).isEqualTo("김학생");
        assertThat(s1.section()).isEqualTo("A반");
        assertThat(s1.registered()).isTrue();
        var s9 = progress.students().stream().filter(s -> s.studentId().equals("s9")).findFirst().orElseThrow();
        assertThat(s9.registered()).isFalse();
        assertThat(progress.items()).noneMatch(item -> item.taskIds().contains(unpublished.getId()));
        var item = progress.items().stream().filter(i -> i.taskIds().contains(published.getId())).findFirst().orElseThrow();
        assertThat(item.submitted()).extracting(ProfessorProgressResponse.Submitted::studentId).containsExactly("s1");
        assertThat(item.submitted().get(0).finalizedAt()).isNotNull();
    }

    @Test
    void activityListsSubmissionsAndQuestionsNewestFirst() {
        accounts.createUser(new RegisterRequest("s1", "김학생", "password123", "STUDENT"));
        TaskEntity task = draft();
        coursework.publish(task.getId(), request(task.getId(), "Band"));
        Long cropA = task.getCrops().get(0).getId(), cropB = task.getCrops().get(1).getId();
        submissions.submit(cropA, "s1", "Band");
        submissions.submit(cropB, "s1", "Band");
        submissions.finalizeAttempt(task.getId(), "s1");
        reportService.createReport(new CropIssueReportRequest(task.getId(), cropA, "s1", "헷갈림: 핵 모양이 애매합니다"), "s1");
        em.flush(); em.clear();

        var activity = dashboard.getActivity(30);

        assertThat(activity.unansweredReports()).isEqualTo(1);
        Event submitted = activity.events().stream().filter(e -> e.type().equals("SUBMITTED")).findFirst().orElseThrow();
        assertThat(submitted.studentName()).isEqualTo("김학생");
        assertThat(submitted.taskId()).isEqualTo(task.getId());
        Event question = activity.events().stream().filter(e -> e.type().equals("QUESTION")).findFirst().orElseThrow();
        assertThat(question.answered()).isFalse();
        assertThat(question.detail()).contains("헷갈림");
        assertThat(activity.events()).isSortedAccordingTo((a, b) -> b.at().compareTo(a.at()));
        assertThat(dashboard.getActivity(1).events()).hasSize(1);
    }

    @Test
    void rosterImportAddsNewRowsAndFillsInExistingOnes() {
        var first = accounts.importStudentRoster(new StudentRosterImportRequest(List.of(
                new Row("2021001", null, null), new Row(" 2021002 ", "박학생", "1분반"),
                new Row("2021002", "중복", "2분반"), new Row("  ", "빈 학번", null))), "prof");
        assertThat(first.added()).isEqualTo(2);
        assertThat(first.skipped()).isEqualTo(2);
        var second = accounts.importStudentRoster(new StudentRosterImportRequest(List.of(
                new Row("2021001", "최학생", "1분반"), new Row("2021002", "박학생", "1분반"))), "prof");
        assertThat(second.added()).isZero();
        assertThat(second.updated()).isEqualTo(1);
        assertThat(second.skipped()).isEqualTo(1);
        assertThat(accounts.getStudentRoster()).anyMatch(r -> r.studentId().equals("2021001")
                && "최학생".equals(r.name()) && "1분반".equals(r.section()));
    }

    @Test
    void dashboardApisAreLimitedToProfessors() throws Exception {
        mvc.perform(get("/api/professor/progress").with(role("STUDENT"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/professor/activity").with(role("STUDENT"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/professor/progress").with(role("EXPERT"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
        mvc.perform(get("/api/professor/activity").with(role("EXPERT"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.unansweredReports").isNumber());
    }

    @Test
    void rosterImportEndpointAcceptsCsvRowsFromTheClient() throws Exception {
        String body = "{\"rows\":[{\"studentId\":\"2026001\",\"name\":\"홍길동\",\"section\":\"1분반\"},{\"studentId\":\"2026002\",\"name\":null,\"section\":null}]}";
        mvc.perform(post("/api/professor/students/roster/import").with(role("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/professor/students/roster/import").with(role("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk())
                .andExpect(jsonPath("$.added").value(2)).andExpect(jsonPath("$.updated").value(0));
        mvc.perform(get("/api/professor/students/roster").with(role("EXPERT"))).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.studentId=='2026001')].section").value("1분반"));
    }

    private RequestPostProcessor role(String role) {
        return authentication(new UsernamePasswordAuthenticationToken("user", null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    private TaskEntity draft() {
        var dog = species.findByCode("DOG").orElseThrow();
        var task = TaskEntity.builder().kind(TaskKind.PRACTICE).status(TaskStatus.DRAFT).title("준비 중 과제")
                .originalFilename("draft-smear.png").uploadedFilename("smear.png").animalSpecies(dog).build();
        task.addCrop(CropEntity.builder().cropFilename("cell-1.png").bbox("[0,0,10,10]").build());
        task.addCrop(CropEntity.builder().cropFilename("cell-2.png").bbox("[20,20,30,30]").build());
        return tasks.saveAndFlush(task);
    }

    private CourseworkSaveRequest request(Long id, String label) {
        var current = coursework.get(id);
        var revisions = new LinkedHashMap<Long, Long>();
        current.tasks().forEach(part -> revisions.put(part.task().id(), part.task().revision()));
        var edits = new ArrayList<CourseworkSaveRequest.CellEdit>();
        current.tasks().stream().flatMap(part -> part.crops().stream())
                .forEach(cell -> edits.add(new CourseworkSaveRequest.CellEdit(cell.id(), label, false, null)));
        return new CourseworkSaveRequest("수업 과제", null, true, false, revisions, edits);
    }
}
