package com.cell.platform.controller;
import com.cell.platform.entity.AnnouncementEntity;
import com.cell.platform.entity.AnnouncementEntity.Audience;
import com.cell.platform.infra.announcement.AnnouncementJpaRepository;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.exception.AuthorizationException;
import com.cell.platform.exception.ErrorCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AnnouncementController {
    private final AnnouncementJpaRepository repository;
    public record NoticeRequest(@NotBlank @Size(max=200) String title, @NotBlank @Size(max=10000) String body,
                                @NotNull Audience audience, boolean urgent) {}
    @GetMapping("/api/announcements")
    public List<AnnouncementEntity> visible(Authentication auth) {
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) return all();
        Audience role = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EXPERT")) ? Audience.EXPERT : Audience.STUDENT;
        return repository.findAllByAudienceInOrderByUrgentDescCreatedAtDescIdDesc(List.of(Audience.ALL, role));
    }
    @GetMapping("/api/admin/announcements")
    public List<AnnouncementEntity> all() { return repository.findAllByOrderByUrgentDescCreatedAtDescIdDesc(); }
    @GetMapping("/api/professor/announcements")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    public List<AnnouncementEntity> professor(Authentication auth) {
        if (isAdmin(auth)) return all();
        return repository.findAllByAudienceInOrAuthorOrderByUrgentDescCreatedAtDescIdDesc(
                List.of(Audience.ALL, Audience.EXPERT), auth.getName());
    }
    @PostMapping({"/api/admin/announcements", "/api/professor/announcements"})
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    public AnnouncementEntity create(@Valid @RequestBody NoticeRequest request, Authentication auth) {
        return repository.save(new AnnouncementEntity(request.title(), request.body(), request.audience(), request.urgent(), auth.getName()));
    }
    @PutMapping({"/api/admin/announcements/{id}", "/api/professor/announcements/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    @Transactional
    public AnnouncementEntity update(@PathVariable Long id, @Valid @RequestBody NoticeRequest request, Authentication auth) {
        var notice = required(id);
        requireOwnerOrAdmin(notice, auth);
        notice.update(request.title(), request.body(), request.audience(), request.urgent());
        return notice;
    }
    @DeleteMapping({"/api/admin/announcements/{id}", "/api/professor/announcements/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        var notice = required(id);
        requireOwnerOrAdmin(notice, auth);
        repository.delete(notice);
        return ResponseEntity.noContent().build();
    }
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
    private void requireOwnerOrAdmin(AnnouncementEntity notice, Authentication auth) {
        if (!isAdmin(auth) && !notice.getAuthor().equals(auth.getName())) {
            throw new AuthorizationException("본인이 작성한 공지만 수정하거나 삭제할 수 있습니다.", ErrorCode.G000);
        }
    }
    private AnnouncementEntity required(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("공지를 찾을 수 없습니다.", ErrorCode.G000));
    }
}
