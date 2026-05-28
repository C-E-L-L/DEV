package com.cell.platform.service;

import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.UserStatus;
import com.cell.platform.dto.request.AdminProfessorRequest;
import com.cell.platform.dto.request.AdminStatusRequest;
import com.cell.platform.dto.request.StudentRosterRequest;
import com.cell.platform.dto.response.AdminCropResponse;
import com.cell.platform.dto.response.AdminSmearResponse;
import com.cell.platform.dto.response.AdminUserResponse;
import com.cell.platform.dto.response.RosterImportResponse;
import com.cell.platform.dto.response.StudentRosterResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.StudentRosterEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.entity.UserEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.cell.platform.infra.user.StudentRosterJpaRepository;
import com.cell.platform.infra.user.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final TaskJpaRepository taskJpaRepository;
    private final CropJpaRepository cropJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final StudentRosterJpaRepository studentRosterJpaRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AdminSmearResponse> getSmears() {
        List<TaskEntity> tasks = taskJpaRepository.findAllUploadedSmearsOrderByIdDesc();
        Map<Long, Long> totalCounts = toCountMap(cropJpaRepository.countByTaskId());
        Map<Long, Long> labeledCounts = toCountMap(cropJpaRepository.countLabeledByTaskId());

        return tasks.stream()
                .map(task -> {
                    long total = totalCounts.getOrDefault(task.getId(), 0L);
                    long labeled = labeledCounts.getOrDefault(task.getId(), 0L);
                    return new AdminSmearResponse(
                            task.getId(),
                            task.getOriginalFilename(),
                            task.getUploadedFilename(),
                            task.getCreatedAt(),
                            total,
                            labeled,
                            labeled > 0
                    );
                })
                .toList();
    }

    public List<AdminCropResponse> getCrops() {
        List<CropEntity> crops = cropJpaRepository.findAllWithTaskOriginalFilename();
        return crops.stream()
                .map(crop -> {
                    TaskEntity task = crop.getTask();
                    return new AdminCropResponse(
                            crop.getId(),
                            task != null ? task.getId() : null,
                            crop.getCropFilename(),
                            task != null ? task.getUploadedFilename() : null,
                            crop.getGtLabel() != null ? crop.getGtLabel().name() : null,
                            crop.getPseudoLabel() != null ? crop.getPseudoLabel().name() : null,
                            crop.getFinalLabel() != null ? crop.getFinalLabel().name() : null,
                            crop.getFinalLabel() != null
                    );
                })
                .toList();
    }

    public List<AdminUserResponse> getProfessors() {
        return userJpaRepository.findAllByRoleOrderByIdDesc(Role.EXPERT).stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse createProfessor(AdminProfessorRequest request) {
        String username = normalizeRequired(request.username(), "username");
        if (userJpaRepository.existsByUsername(username)) {
            throw new BadRequestException("Username already exists: " + username, ErrorCode.U000);
        }
        UserEntity professor = UserEntity.builder()
                .username(username)
                .name(normalizeOptional(request.name()))
                .password(passwordEncoder.encode(normalizeRequired(request.password(), "password")))
                .role(Role.EXPERT)
                .status(UserStatus.ACTIVE)
                .build();
        return AdminUserResponse.from(userJpaRepository.save(professor));
    }

    @Transactional
    public AdminUserResponse resetProfessorPassword(Long userId, String password) {
        UserEntity professor = findProfessor(userId);
        professor.changePassword(passwordEncoder.encode(normalizeRequired(password, "password")));
        return AdminUserResponse.from(professor);
    }

    @Transactional
    public AdminUserResponse updateProfessorStatus(Long userId, AdminStatusRequest request) {
        UserEntity professor = findProfessor(userId);
        UserStatus status = parseStatus(request.status());
        if (status != UserStatus.ACTIVE && status != UserStatus.INACTIVE) {
            throw new BadRequestException("Professor accounts can only be ACTIVE or INACTIVE.", ErrorCode.U003);
        }
        professor.changeStatus(status);
        return AdminUserResponse.from(professor);
    }

    public List<StudentRosterResponse> getStudentRoster() {
        return studentRosterJpaRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(StudentRosterResponse::from)
                .toList();
    }

    @Transactional
    public RosterImportResponse addStudentRoster(StudentRosterRequest request, String adminUsername) {
        Set<String> ids = normalizeStudentIds(request.studentIds());
        int added = 0;
        int skipped = 0;
        for (String studentId : ids) {
            if (studentRosterJpaRepository.existsByStudentId(studentId)) {
                skipped++;
                continue;
            }
            studentRosterJpaRepository.save(new StudentRosterEntity(studentId, adminUsername));
            added++;
        }
        return new RosterImportResponse(added, skipped);
    }

    public List<AdminUserResponse> getStudentSignupRequests(String status) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            return userJpaRepository.findAllByRoleOrderByIdDesc(Role.STUDENT).stream()
                    .filter(user -> user.getStatus() == UserStatus.PENDING || user.getStatus() == UserStatus.REJECTED)
                    .map(AdminUserResponse::from)
                    .toList();
        }
        UserStatus parsed = parseStatus(status);
        return userJpaRepository.findAllByRoleAndStatusOrderByIdDesc(Role.STUDENT, parsed).stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    public List<AdminUserResponse> getStudents(String status) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            return userJpaRepository.findAllByRoleOrderByIdDesc(Role.STUDENT).stream()
                    .map(AdminUserResponse::from)
                    .toList();
        }
        UserStatus parsed = parseStatus(status);
        return userJpaRepository.findAllByRoleAndStatusOrderByIdDesc(Role.STUDENT, parsed).stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse updateStudentStatus(Long userId, AdminStatusRequest request) {
        UserEntity student = findStudent(userId);
        UserStatus status = parseStatus(request.status());
        if (status != UserStatus.ACTIVE && status != UserStatus.INACTIVE && status != UserStatus.REJECTED) {
            throw new BadRequestException("Student accounts can only be ACTIVE, INACTIVE, or REJECTED.", ErrorCode.U003);
        }
        student.changeStatus(status);
        return AdminUserResponse.from(student);
    }

    @Transactional
    public AdminUserResponse approveStudent(Long userId, String adminUsername) {
        UserEntity student = findStudent(userId);
        student.changeStatus(UserStatus.ACTIVE);
        StudentRosterEntity roster = studentRosterJpaRepository.findByStudentId(student.getUsername())
                .orElseGet(() -> studentRosterJpaRepository.save(new StudentRosterEntity(student.getUsername(), adminUsername)));
        roster.claim(student.getId());
        return AdminUserResponse.from(student);
    }

    @Transactional
    public AdminUserResponse rejectStudent(Long userId) {
        UserEntity student = findStudent(userId);
        student.changeStatus(UserStatus.REJECTED);
        return AdminUserResponse.from(student);
    }

    private UserEntity findProfessor(Long userId) {
        UserEntity user = findUser(userId);
        if (user.getRole() != Role.EXPERT) {
            throw new BadRequestException("The selected account is not a professor account.", ErrorCode.U003);
        }
        return user;
    }

    private UserEntity findStudent(Long userId) {
        UserEntity user = findUser(userId);
        if (user.getRole() != Role.STUDENT) {
            throw new BadRequestException("The selected account is not a student account.", ErrorCode.U003);
        }
        return user;
    }

    private UserEntity findUser(Long userId) {
        return userJpaRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Account not found. userId=" + userId, ErrorCode.U001));
    }

    private UserStatus parseStatus(String status) {
        try {
            return UserStatus.valueOf(normalizeRequired(status, "status").toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid account status: " + status, ErrorCode.U003);
        }
    }

    private Set<String> normalizeStudentIds(List<String> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new BadRequestException("Enter at least one student id.", ErrorCode.G000);
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String raw : studentIds) {
            String value = normalizeOptional(raw);
            if (value != null) {
                normalized.add(value);
            }
        }
        if (normalized.isEmpty()) {
            throw new BadRequestException("Enter at least one student id.", ErrorCode.G000);
        }
        return normalized;
    }

    private String normalizeRequired(String value, String fieldName) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new BadRequestException(fieldName + " is required.", ErrorCode.G000);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2) {
                continue;
            }
            Long taskId = (Long) row[0];
            long count = ((Number) row[1]).longValue();
            map.put(taskId, count);
        }
        return map;
    }
}
