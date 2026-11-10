package com.cell.platform.service;

import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.task.*;
import com.cell.platform.dto.request.*;
import com.cell.platform.entity.*;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.cell.platform.infra.matrix.ConfusionMatrixJpaRepository;
import com.cell.platform.infra.species.AnimalSpeciesJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CourseworkWorkflowIntegrationTest {
    @Autowired CourseworkService coursework;
    @Autowired TaskService taskService;
    @Autowired CropService cropService;
    @Autowired SubmissionService submissions;
    @Autowired LabelingService labels;
    @Autowired TaskJpaRepository tasks;
    @Autowired CropJpaRepository crops;
    @Autowired ConfusionMatrixJpaRepository matrices;
    @Autowired AnimalSpeciesJpaRepository species;
    @Autowired EntityManager em;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CellClassService cellClasses;
    @Autowired CalibrationService calibration;
    @Autowired AdminService accounts;

    @Test
    void customClassSurvivesReloadAndCatalogChangesDoNotRewriteExistingTasks() {
        var dog=species.findByCode("DOG").orElseThrow();
        var added=cellClasses.create(dog.getId(),"Basophil","호염기구");
        var task=draft(TaskKind.PRACTICE);
        task.setClassLabels(cellClasses.activeLabels(dog.getId()));
        tasks.flush();
        coursework.publish(task.getId(),request(task.getId(),true,"Basophil",true));
        cellClasses.update(dog.getId(),added.getId(),"수정된 이름",false);
        Long id=task.getId(),cropId=task.getCrops().get(0).getId();
        em.flush();em.clear();
        assertThat(cellClasses.activeLabels(dog.getId())).doesNotContainKey("Basophil");
        assertThat(coursework.get(id).tasks().get(0).task().classLabels()).containsEntry("Basophil","호염기구");
        submissions.submit(cropId,"s1","Basophil");submissions.finalizeAttempt(id,"s1");
        assertThat(submissions.getMyResults(id,"s1").correct()).isEqualTo(1);
        assertThat(submissions.getMyResults(id,"s1").labels()).contains("Basophil");
    }

    @Test
    void calibrationSeparatesSpeciesSchemasAndInitialFromCumulativeAndIgnoresAutosave() {
        accounts.createUser(new RegisterRequest("s1","Student","password123","STUDENT"));
        var first=draft(TaskKind.DIAGNOSTIC);
        coursework.publish(first.getId(),request(first.getId(),true,"Band",true));
        submissions.submit(first.getCrops().get(0).getId(),"s1","Band");
        Long dogId=first.getAnimalSpecies().getId();
        assertThat(calibration.get(dogId,"INITIAL",null).studentMatrices().get(0).getTotalSolved()).isZero();
        submissions.finalizeAttempt(first.getId(),"s1");
        var second=draft(TaskKind.DIAGNOSTIC);
        coursework.publish(second.getId(),request(second.getId(),true,"Band",true));
        submissions.submit(second.getCrops().get(0).getId(),"s1","Monocyte");submissions.finalizeAttempt(second.getId(),"s1");
        var initial=calibration.get(dogId,"INITIAL",null).studentMatrices().get(0);
        assertThat(initial.getSourceTaskIds()).containsExactly(first.getId());
        assertThat(initial.getAccuracy()).isEqualTo(100);
        assertThat(calibration.get(dogId,"DIAGNOSTIC",null).studentMatrices().get(0).getTotalSolved()).isEqualTo(2);
        assertThat(calibration.get(species.findByCode("CAT").orElseThrow().getId(),"ALL",null).studentMatrices().get(0).getTotalSolved()).isZero();
        var third=draft(TaskKind.DIAGNOSTIC);third.setClassLabels(Map.of("Band","Band"));tasks.flush();
        coursework.publish(third.getId(),request(third.getId(),true,"Band",true));
        submissions.submit(third.getCrops().get(0).getId(),"s1","UNKNOWN");submissions.finalizeAttempt(third.getId(),"s1");
        var distinct=calibration.get(dogId,"ALL","Band");
        assertThat(distinct.schemas()).hasSize(2);
        assertThat(distinct.studentMatrices().get(0).getSourceTaskIds()).containsExactly(third.getId());
        assertThat(distinct.studentMatrices().get(0).getUnknownCount()).isEqualTo(1);
        assertThat(distinct.studentMatrices().get(0).getTotalSolved()).isZero();
    }

    @Test
    void professorStudentEndpointCannotCreatePrivilegedAccountAndStudentCannotUseIt() throws Exception {
        var body="{\"username\":\"newstudent\",\"name\":\"Student\",\"password\":\"password123\",\"role\":\"ADMIN\"}";
        mvc.perform(post("/api/professor/students").with(student()).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        var professor=authentication(new UsernamePasswordAuthenticationToken("professor",null,List.of(new SimpleGrantedAuthority("ROLE_EXPERT"))));
        mvc.perform(post("/api/professor/students").with(professor).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        assertThat(accounts.getUsers()).anyMatch(u -> u.username().equals("newstudent") && u.role().equals("STUDENT"));
    }

    private RequestPostProcessor student() { return authentication(new UsernamePasswordAuthenticationToken("s1", null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))); }

    private TaskEntity draft(TaskKind kind) {
        var dog = species.findByCode("DOG").orElseThrow();
        var task = TaskEntity.builder().kind(kind).status(TaskStatus.DRAFT).title("준비 중 과제")
                .originalFilename(kind == TaskKind.DIAGNOSTIC ? "" : "draft-smear.png")
                .uploadedFilename(kind == TaskKind.DIAGNOSTIC ? "diagnostic-test" : "smear.png")
                .animalSpecies(dog).requireLabels(kind == TaskKind.DIAGNOSTIC).build();
        task.addCrop(CropEntity.builder().cropFilename("cell-1.png").bbox("[0,0,10,10]").build());
        task.addCrop(CropEntity.builder().cropFilename("cell-2.png").bbox("[20,20,30,30]").build());
        return tasks.saveAndFlush(task);
    }

    private CourseworkSaveRequest request(Long id, boolean requireLabels, String label, boolean excludeSecond) {
        var current = coursework.get(id);
        var revisions = new LinkedHashMap<Long,Long>();
        current.tasks().forEach(part -> revisions.put(part.task().id(), part.task().revision()));
        var cells = current.tasks().stream().flatMap(part -> part.crops().stream()).toList();
        var edits = new ArrayList<CourseworkSaveRequest.CellEdit>();
        for (int i=0;i<cells.size();i++) edits.add(new CourseworkSaveRequest.CellEdit(cells.get(i).id(), label,
                excludeSecond && i==1, excludeSecond && i==1 ? "위치 이상" : null));
        return new CourseworkSaveRequest("수업 과제", null, requireLabels, false, revisions, edits);
    }

    @Test
    void draftSurvivesReloadAndCompletedLabelingStillNeedsExplicitPublication() throws Exception {
        Long id = draft(TaskKind.PRACTICE).getId();
        coursework.save(id, request(id, true, "Band", true));
        em.flush(); em.clear();
        var restored = coursework.get(id);
        assertThat(restored.tasks().get(0).task().status()).isEqualTo("DRAFT");
        assertThat(restored.tasks().get(0).task().labeledCount()).isEqualTo(1);
        assertThat(restored.tasks().get(0).task().excludedCount()).isEqualTo(1);
        assertThat(restored.tasks().get(0).crops().get(1).exclusionReason()).isEqualTo("위치 이상");
        assertThat(taskService.getAllTasks(true)).noneMatch(t -> t.id().equals(id));
        mvc.perform(get("/api/tasks/{id}/crops", id).with(student())).andExpect(status().isNotFound());
        mvc.perform(get("/api/coursework/{id}", id).with(student())).andExpect(status().isForbidden());
        mvc.perform(get("/data/originals/draft-smear.png").with(student())).andExpect(status().isNotFound());
        coursework.publish(id, request(id, true, "Band", true));
        em.flush(); em.clear();
        mvc.perform(get("/api/tasks/{id}/crops",id).with(student())).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].finalLabel").doesNotExist());
        assertThat(taskService.getAllTasks(true)).anyMatch(t -> t.id().equals(id) && t.cropCount()==1);
    }

    @Test
    void excludedCellsCannotBeAnsweredAndDoNotEnterGradingOrMatrices() {
        var task=draft(TaskKind.PRACTICE); Long id=task.getId();
        coursework.publish(id,request(id,true,"Band",true));
        Long eligible=task.getCrops().get(0).getId(), excluded=task.getCrops().get(1).getId();
        assertThatThrownBy(()->submissions.submit(excluded,"s1","Band")).hasMessageContaining("제외");
        submissions.submit(eligible,"s1","Band");
        submissions.finalizeAttempt(id,"s1");
        assertThat(submissions.getMyResults(id,"s1").total()).isEqualTo(1);
        assertThat(matrices.findByStudentIdAndTaskId("s1",id).orElseThrow().getMatrixData().get("Band").get("Band")).isEqualTo(1);
        assertThat(cropService.getConfirmedTrainingData()).noneMatch(c->c.cropId().equals(excluded));
    }

    @Test
    void unlabeledPracticeCanPublishAndLateJsonLabelsRegradeExactlyOnce() throws Exception {
        var task=draft(TaskKind.PRACTICE); Long id=task.getId();
        coursework.publish(id,request(id,false,null,true));
        Long cell=task.getCrops().get(0).getId();
        submissions.submit(cell,"s1","Band");
        assertThat(submissions.finalizeAttempt(id,"s1").get("reviewAvailable")).isFalse();
        var input=json.readTree("{\"annotations\":[{\"cropId\":"+cell+",\"label\":\"Band\"}]}");
        labels.importLabels(id,input); labels.importLabels(id,input);
        em.flush(); em.clear();
        assertThat(submissions.getAttemptState(id,"s1").get("reviewAvailable")).isTrue();
        assertThat(submissions.getMyResults(id,"s1").correct()).isEqualTo(1);
        assertThat(matrices.findByStudentIdAndTaskId("s1",id).orElseThrow().getMatrixData().get("Band").get("Band")).isEqualTo(1);
        labels.importLabels(id,json.readTree("{\"annotations\":[{\"cropId\":"+cell+",\"label\":\"Segment\"}]}"));
        em.flush(); em.clear();
        var matrix=matrices.findByStudentIdAndTaskId("s1",id).orElseThrow().getMatrixData();
        assertThat(matrix.get("Band").get("Band")).isZero();
        assertThat(matrix.get("Segment").get("Band")).isEqualTo(1);
        assertThat(submissions.getMyResults(id,"s1").wrong()).isEqualTo(1);
    }

    @Test
    void unknownCountsAsAnsweredButNotAsACellClassAndOnlyFinalSubmissionLocksAnswers() {
        var task=draft(TaskKind.DIAGNOSTIC); Long id=task.getId();
        coursework.publish(id,request(id,true,"Band",false));
        Long a=task.getCrops().get(0).getId(), b=task.getCrops().get(1).getId();
        submissions.submit(a,"s1","Band"); submissions.submit(b,"s1","UNKNOWN");
        assertThat(submissions.getAttemptState(id,"s1").get("locked")).isFalse();
        assertThat(submissions.getAttemptState(id,"s1").get("reviewAvailable")).isFalse();
        submissions.submit(a,"s1","Segment");
        assertThat(submissions.finalizeAttempt(id,"s1").get("reviewAvailable")).isTrue();
        assertThat(submissions.getSolvedCropLabels(id,"s1")).containsEntry(b,"UNKNOWN");
        assertThat(submissions.getMyResults(id,"s1").total()).isEqualTo(2);
        assertThat(submissions.getMyResults(id,"s1").confusionMatrix().get("Band")).doesNotContainKey("UNKNOWN");
        assertThatThrownBy(()->submissions.submit(a,"s1","Band")).hasMessageContaining("수정");
    }

    @Test
    void diagnosticAndRequiredLabelPracticeCannotPublishIncompleteOrEmptyQuestionSets() {
        Long id=draft(TaskKind.DIAGNOSTIC).getId();
        assertThatThrownBy(()->coursework.publish(id,request(id,false,null,false))).hasMessageContaining("정답 미확정");
        assertThat(tasks.findById(id).orElseThrow().getStatus()).isEqualTo(TaskStatus.DRAFT);
    }

    @Test
    void publishingAfterDeadlineIsRejectedAndResultReleaseIsIndependentOfLabelCompletion() {
        var task=draft(TaskKind.DIAGNOSTIC); Long id=task.getId();
        var body=request(id,true,"Band",true);
        var delayed=new CourseworkSaveRequest(body.title(),LocalDateTime.now().plusDays(1),true,true,body.revisions(),body.cells());
        coursework.publish(id,delayed);
        submissions.submit(task.getCrops().get(0).getId(),"s1","Band");
        assertThat(submissions.finalizeAttempt(id,"s1").get("reviewAvailable")).isFalse();
        task.updateDeadlineAt(LocalDateTime.now().minusMinutes(1)); em.flush();
        assertThat(submissions.getAttemptState(id,"s1").get("reviewAvailable")).isTrue();
    }

    @Test
    void copyReusesImageFilesButKeepsStudentResponsesAndPublicationIndependent() {
        var original=draft(TaskKind.PRACTICE); Long id=original.getId();
        coursework.publish(id,request(id,true,"Band",true));
        submissions.submit(original.getCrops().get(0).getId(),"s1","Band");
        var copied=coursework.copy(id);
        assertThat(copied.id()).isNotEqualTo(id);
        assertThat(copied.tasks().get(0).task().status()).isEqualTo("DRAFT");
        assertThat(copied.tasks().get(0).crops().get(0).cropFilename()).isEqualTo(original.getCrops().get(0).getCropFilename());
        assertThat(copied.tasks().get(0).crops().get(0).id()).isNotEqualTo(original.getCrops().get(0).getId());
        assertThat(submissions.getSolvedCropLabels(copied.id(),"s1")).isEmpty();
        assertThat(submissions.getSolvedCropLabels(id,"s1")).hasSize(1);
    }

    @Test
    void staleDraftCannotOverwriteSavedWork() {
        Long id=draft(TaskKind.PRACTICE).getId();
        var stale=request(id,false,null,false);
        coursework.save(id,request(id,true,"Band",false));
        assertThatThrownBy(()->coursework.save(id,stale)).isInstanceOf(org.springframework.orm.ObjectOptimisticLockingFailureException.class);
    }
}
