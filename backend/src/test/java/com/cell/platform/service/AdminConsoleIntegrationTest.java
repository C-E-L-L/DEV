package com.cell.platform.service;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.domain.crop.CellType;
import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.domain.user.*;
import com.cell.platform.entity.*;
import com.cell.platform.infra.user.UserJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminConsoleIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserJpaRepository users;
    @Autowired TaskJpaRepository tasks;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtTokenProvider tokens;
    @Autowired AdminDashboardService dashboard;
    @Autowired ObjectMapper json;
    @Autowired EntityManager em;

    @Test
    void announcementsRespectAudienceAndAdminCanEditAndDelete() throws Exception {
        long all = notice("For everyone", "ALL", false);
        notice("For students", "STUDENT", true);
        notice("For professors", "EXPERT", false);
        var student = json.readTree(mvc.perform(get("/api/announcements").with(user("s").roles("STUDENT"))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(student.size()).isEqualTo(2);
        assertThat(student.get(0).get("title").asText()).isEqualTo("For students");
        var professor = mvc.perform(get("/api/announcements").with(user("p").roles("EXPERT"))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(professor).contains("For professors", "For everyone").doesNotContain("For students");
        mvc.perform(put("/api/admin/announcements/"+all).with(user("a").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("title","Changed", "body","New body", "audience","EXPERT", "urgent",true)))).andExpect(status().isOk());
        mvc.perform(get("/api/announcements").with(user("s").roles("STUDENT"))).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Changed"))));
        mvc.perform(delete("/api/admin/announcements/"+all).with(user("a").roles("ADMIN"))).andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/announcements/"+all).with(user("a").roles("ADMIN"))).andExpect(status().isNotFound());
    }

    @Test
    void announcementWritesAndDashboardAreAdminOnlyAndRequireValidContent() throws Exception {
        mvc.perform(get("/api/announcements")).andExpect(status().isUnauthorized());
        for (String role : List.of("STUDENT", "EXPERT")) {
            mvc.perform(get("/api/admin/dashboard").with(user("u").roles(role))).andExpect(status().isForbidden());
            mvc.perform(post("/api/admin/announcements").with(user("u").roles(role)).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        }
        mvc.perform(post("/api/admin/announcements").with(user("a").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\" \",\"body\":\"text\",\"audience\":\"ALL\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/announcements").with(user("a").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Title\",\"body\":\"text\",\"audience\":\"INVALID\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void passwordResetPreservesAccountAndInvalidatesOnlyItsOldTokens() throws Exception {
        var student = account("reset-student", Role.STUDENT);
        var other = account("unchanged-student", Role.STUDENT);
        String oldToken=tokens.generateToken(student.getUsername(),"STUDENT");
        String otherToken=tokens.generateToken(other.getUsername(),"STUDENT");
        mvc.perform(get("/api/tasks").header("Authorization","Bearer "+oldToken)).andExpect(status().isOk());
        mvc.perform(put("/api/admin/users/"+student.getId()+"/password").with(user("a").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"new-password-123\"}")).andExpect(status().isNoContent());
        em.flush();
        mvc.perform(get("/api/tasks").header("Authorization","Bearer "+oldToken)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/tasks").header("Authorization","Bearer "+otherToken)).andExpect(status().isOk());
        assertThat(users.findById(student.getId()).orElseThrow().getName()).isEqualTo("Preserved name");
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"reset-student\",\"password\":\"old-password-123\"}")).andExpect(status().isBadRequest());
        String response=mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"reset-student\",\"password\":\"new-password-123\"}")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String nextToken=json.readTree(response).get("accessToken").asText();
        mvc.perform(get("/api/tasks").header("Authorization","Bearer "+nextToken)).andExpect(status().isOk());
    }

    @Test
    void passwordsRejectPrivilegedAccountsAndInvalidValues() throws Exception {
        var admin=account("another-admin", Role.ADMIN);
        var student=account("password-target", Role.STUDENT);
        mvc.perform(put("/api/admin/users/"+admin.getId()+"/password").with(user("a").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content("{\"newPassword\":\"password-123\"}")).andExpect(status().isBadRequest());
        mvc.perform(put("/api/admin/users/"+student.getId()+"/password").with(user("s").roles("STUDENT")).contentType(MediaType.APPLICATION_JSON).content("{\"newPassword\":\"password-123\"}")).andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/users/"+student.getId()+"/password").with(user("a").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content("{\"newPassword\":\"short\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void summaryGroupsSmearsIntoOneAssignmentAndExcludesRemovedLabels() {
        var before=dashboard.get();
        TaskEntity first=TaskEntity.builder().originalFilename("dashboard-1.jpg").uploadedFilename("one.jpg").status(TaskStatus.IN_PROGRESS).assignmentId(998877L).build();
        first.addCrop(CropEntity.builder().cropFilename("dash-1.jpg").bbox("[0,0,1,1]").finalLabel(CellType.Band).build());
        first.addCrop(CropEntity.builder().cropFilename("dash-2.jpg").bbox("[0,0,1,1]").finalLabel(CellType.Band).excluded(true).build());
        TaskEntity second=TaskEntity.builder().originalFilename("dashboard-2.jpg").uploadedFilename("two.jpg").status(TaskStatus.IN_PROGRESS).assignmentId(998877L).build();
        second.addCrop(CropEntity.builder().cropFilename("dash-3.jpg").bbox("[0,0,1,1]").build());
        tasks.save(first); tasks.save(second); em.flush();
        // Older coursework with no saved catalog follows the existing converter's default catalog.
        em.createNativeQuery("UPDATE tasks SET class_labels=null WHERE id=:id").setParameter("id", first.getId()).executeUpdate();
        var after=dashboard.get();
        assertThat(after.activeCoursework()).isEqualTo(before.activeCoursework()+1);
        assertThat(after.smears()).isEqualTo(before.smears()+2);
        assertThat(after.cells()).isEqualTo(before.cells()+3);
        assertThat(after.confirmedCells()).isEqualTo(before.confirmedCells()+1);
        assertThat(after.pendingLabels()).isEqualTo(before.pendingLabels()+1);
        assertThat(after.distributions().stream().mapToLong(group->group.counts().getOrDefault("Band",0L)).sum())
                .isEqualTo(before.distributions().stream().mapToLong(group->group.counts().getOrDefault("Band",0L)).sum()+1);
    }

    private long notice(String title,String audience,boolean urgent) throws Exception {
        String response=mvc.perform(post("/api/admin/announcements").with(user("a").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("title",title,"body","Notice content","audience",audience,"urgent",urgent)))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asLong();
    }
    private UserEntity account(String username,Role role) {
        return users.saveAndFlush(UserEntity.builder().username(username).name("Preserved name").role(role).status(UserStatus.ACTIVE).password(encoder.encode("old-password-123")).build());
    }
}
