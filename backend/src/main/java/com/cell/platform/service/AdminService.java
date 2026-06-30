package com.cell.platform.service;

import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.domain.user.UserStatus;
import com.cell.platform.dto.request.AdminStatusRequest;
import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.request.StudentRosterRequest;
import com.cell.platform.dto.response.AdminCropResponse;
import com.cell.platform.dto.response.AdminSmearResponse;
import com.cell.platform.dto.response.RosterImportResponse;
import com.cell.platform.dto.response.StudentRosterResponse;
import com.cell.platform.dto.response.UserResponse;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final TaskJpaRepository taskJpaRepository;
    private final CropJpaRepository cropJpaRepository;
    private final UserRepository userRepository;
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
                    boolean hasLabel = labeled > 0;
                    return new AdminSmearResponse(
                            task.getId(),
                            task.getOriginalFilename(),
                            task.getUploadedFilename(),
                            task.getCreatedAt(),
                            total,
                            labeled,
                            hasLabel
                    );
                })
                .toList();
    }

    public List<AdminCropResponse> getCrops() {
        List<CropEntity> crops = cropJpaRepository.findAllWithTaskOriginalFilename();
        return crops.stream()
                .map(crop -> {
                    TaskEntity task = crop.getTask();
                    String gtLabel = crop.getGtLabel() != null ? crop.getGtLabel().name() : null;
                    String pseudoLabel = crop.getPseudoLabel() != null ? crop.getPseudoLabel().name() : null;
                    String finalLabel = crop.getFinalLabel() != null ? crop.getFinalLabel().name() : null;
                    boolean hasLabel = crop.getFinalLabel() != null;
                    return new AdminCropResponse(
                            crop.getId(),
                            task != null ? task.getId() : null,
                            crop.getCropFilename(),
                            task != null ? task.getUploadedFilename() : null,
                        gtLabel,
                        pseudoLabel,
                            finalLabel,
                            hasLabel
                    );
                })
                .toList();
    }

    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.ADMIN)
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getName(), u.getRole().name(), u.getStatus().name(), u.getCreatedAt()))
                .toList();
    }

    public List<StudentRosterResponse> getStudentRoster() {
        return studentRosterJpaRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(StudentRosterResponse::from)
                .toList();
    }

    @Transactional
    public RosterImportResponse addStudentRoster(StudentRosterRequest request, String adminUsername) {
        List<String> studentIds = request.studentIds() == null ? List.of() : request.studentIds();
        int added = 0;
        int skipped = 0;
        for (String raw : studentIds) {
            String studentId = raw == null ? "" : raw.trim();
            if (studentId.isEmpty() || studentRosterJpaRepository.existsByStudentId(studentId)) {
                skipped++;
                continue;
            }
            studentRosterJpaRepository.save(new StudentRosterEntity(studentId, adminUsername));
            added++;
        }
        return new RosterImportResponse(added, skipped);
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, AdminStatusRequest request) {
        UserEntity user = userJpaRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 사용자입니다.", ErrorCode.U001));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("관리자 계정의 상태는 변경할 수 없습니다.", ErrorCode.U003);
        }
        UserStatus status = parseStatus(request.status());
        user.changeStatus(status);
        return new UserResponse(user.getId(), user.getUsername(), user.getName(), user.getRole().name(), user.getStatus().name(), user.getCreatedAt());
    }

    private UserStatus parseStatus(String value) {
        try {
            return UserStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("유효하지 않은 상태값입니다: " + value, ErrorCode.U003);
        }
    }

    @Transactional
    public void createUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("이미 존재하는 아이디입니다: " + request.username(), ErrorCode.U000);
        }
        Role role = Role.find(request.role());
        if (role == Role.ADMIN) {
            throw new BadRequestException("관리자 계정은 생성할 수 없습니다.", ErrorCode.U003);
        }
        String hashedPassword = passwordEncoder.encode(request.password());
        userRepository.save(User.create(request.username(), request.name(), hashedPassword, role));
    }

    @Transactional
    public void deleteUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 사용자입니다.", ErrorCode.U001));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("관리자 계정은 삭제할 수 없습니다.", ErrorCode.U003);
        }
        userRepository.deleteByUsername(username);
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
