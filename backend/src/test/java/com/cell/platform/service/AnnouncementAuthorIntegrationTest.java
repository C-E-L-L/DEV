package com.cell.platform.service;

import com.cell.platform.infra.announcement.AnnouncementJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnnouncementAuthorIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AnnouncementJpaRepository notices;

    @Test
    void professorCreatesWithAuthenticatedAuthorAndCanEditAndDeleteOwnNotice() throws Exception {
        var result = mvc.perform(post("/api/professor/announcements").with(user("teacher").roles("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                        "title", "  Teacher notice  ", "body", "  First body  ", "audience", "STUDENT",
                        "urgent", true, "author", "another-teacher"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.author").value("teacher"))
                .andExpect(jsonPath("$.title").value("Teacher notice")).andReturn();
        long id = json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(put("/api/professor/announcements/" + id).with(user("teacher").roles("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Changed", "EXPERT", false)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.author").value("teacher"))
                .andExpect(jsonPath("$.title").value("Changed"));
        mvc.perform(get("/api/announcements").with(user("student").roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Changed"))));
        mvc.perform(delete("/api/professor/announcements/" + id).with(user("teacher").roles("EXPERT")))
                .andExpect(status().isNoContent());
        assertThat(notices.findById(id)).isEmpty();
    }

    @Test
    void professorsCannotChangeAdministratorOrOtherProfessorNoticesEvenWithForgedAuthor() throws Exception {
        for (String owner : new String[]{"admin", "other-teacher"}) {
            long id = create(owner.equals("admin") ? "/api/admin" : "/api/professor", owner,
                    owner.equals("admin") ? "ADMIN" : "EXPERT", owner + " notice", "ALL", false);
            mvc.perform(put("/api/professor/announcements/" + id).with(user("teacher").roles("EXPERT"))
                    .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                            "title", "Stolen", "body", "Stolen", "audience", "ALL", "author", "teacher"))))
                    .andExpect(status().isForbidden());
            mvc.perform(delete("/api/professor/announcements/" + id).with(user("teacher").roles("EXPERT")))
                    .andExpect(status().isForbidden());
            assertThat(notices.findById(id).orElseThrow().getTitle()).isEqualTo(owner + " notice");
        }
    }

    @Test
    void professorManagementIncludesOwnStudentNoticesWithoutRevealingOthersStudentNotices() throws Exception {
        create("/api/professor", "teacher", "EXPERT", "Own student notice", "STUDENT", true);
        create("/api/professor", "other", "EXPERT", "Other student notice", "STUDENT", false);
        create("/api/admin", "admin", "ADMIN", "Staff notice", "EXPERT", false);
        create("/api/admin", "admin", "ADMIN", "Everyone", "ALL", false);
        var response = mvc.perform(get("/api/professor/announcements").with(user("teacher").roles("EXPERT")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(response).contains("Own student notice", "Staff notice", "Everyone").doesNotContain("Other student notice");
        assertThat(json.readTree(response).get(0).get("title").asText()).isEqualTo("Own student notice");
        String student = mvc.perform(get("/api/announcements").with(user("student").roles("STUDENT")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(student).contains("Own student notice", "Other student notice", "Everyone").doesNotContain("Staff notice");
    }

    @Test
    void administratorsCanStillManageProfessorNoticesAndPreserveTheirAuthor() throws Exception {
        long id = create("/api/professor", "teacher", "EXPERT", "Teacher notice", "STUDENT", false);
        mvc.perform(put("/api/admin/announcements/" + id).with(user("admin").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Admin correction", "ALL", true)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.author").value("teacher"));
        mvc.perform(delete("/api/admin/announcements/" + id).with(user("admin").roles("ADMIN")))
                .andExpect(status().isNoContent());
    }

    @Test
    void studentsAndAnonymousUsersCannotManageAnnouncementsAndProfessorsCannotUseAdminApi() throws Exception {
        long id = create("/api/professor", "teacher", "EXPERT", "Existing", "ALL", false);
        for (String prefix : new String[]{"/api/professor/announcements", "/api/admin/announcements"}) {
            mvc.perform(get(prefix).with(user("student").roles("STUDENT"))).andExpect(status().isForbidden());
            mvc.perform(post(prefix).with(user("student").roles("STUDENT")).contentType(MediaType.APPLICATION_JSON)
                    .content(payload("Forbidden", "ALL", false))).andExpect(status().isForbidden());
            mvc.perform(put(prefix + "/" + id).with(user("student").roles("STUDENT")).contentType(MediaType.APPLICATION_JSON)
                    .content(payload("Forbidden", "ALL", false))).andExpect(status().isForbidden());
            mvc.perform(delete(prefix + "/" + id).with(user("student").roles("STUDENT"))).andExpect(status().isForbidden());
            mvc.perform(get(prefix)).andExpect(status().isUnauthorized());
            mvc.perform(post(prefix).contentType(MediaType.APPLICATION_JSON).content(payload("Anonymous", "ALL", false)))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(put("/api/admin/announcements/" + id).with(user("teacher").roles("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Forbidden", "ALL", false))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/admin/announcements/" + id).with(user("teacher").roles("EXPERT"))).andExpect(status().isForbidden());
    }

    @Test
    void professorContentIsValidatedAndMissingAnnouncementsReturnNotFound() throws Exception {
        mvc.perform(post("/api/professor/announcements").with(user("teacher").roles("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(payload(" ", "ALL", false))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/professor/announcements").with(user("teacher").roles("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Title", "INVALID", false))).andExpect(status().isBadRequest());
        mvc.perform(put("/api/professor/announcements/9999999").with(user("teacher").roles("EXPERT"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Missing", "ALL", false))).andExpect(status().isNotFound());
        mvc.perform(delete("/api/professor/announcements/9999999").with(user("teacher").roles("EXPERT")))
                .andExpect(status().isNotFound());
    }

    private String payload(String title, String audience, boolean urgent) throws Exception {
        return json.writeValueAsString(Map.of("title", title, "body", "Notice body", "audience", audience, "urgent", urgent));
    }
    private long create(String prefix, String author, String role, String title, String audience, boolean urgent) throws Exception {
        String response = mvc.perform(post(prefix + "/announcements").with(user(author).roles(role))
                .contentType(MediaType.APPLICATION_JSON).content(payload(title, audience, urgent)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asLong();
    }
}
