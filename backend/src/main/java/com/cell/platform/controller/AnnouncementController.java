package com.cell.platform.controller;
import com.cell.platform.entity.AnnouncementEntity;
import com.cell.platform.entity.AnnouncementEntity.Audience;
import com.cell.platform.infra.announcement.AnnouncementJpaRepository;
import com.cell.platform.exception.NotFoundException;
import com.cell.platform.exception.ErrorCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    @PostMapping("/api/admin/announcements")
    public AnnouncementEntity create(@Valid @RequestBody NoticeRequest request, Authentication auth) {
        return repository.save(new AnnouncementEntity(request.title(), request.body(), request.audience(), request.urgent(), auth.getName()));
    }
    @PutMapping("/api/admin/announcements/{id}")
    @Transactional
    public AnnouncementEntity update(@PathVariable Long id, @Valid @RequestBody NoticeRequest request) {
        var notice = required(id);
        notice.update(request.title(), request.body(), request.audience(), request.urgent());
        return notice;
    }
    @DeleteMapping("/api/admin/announcements/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.delete(required(id));
        return ResponseEntity.noContent().build();
    }
    private AnnouncementEntity required(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("공지를 찾을 수 없습니다.", ErrorCode.G000));
    }
}
