package com.cell.platform.service;

import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.response.AdminCropResponse;
import com.cell.platform.dto.response.AdminSmearResponse;
import com.cell.platform.dto.response.UserResponse;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
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
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getName(), u.getRole().name(), u.getCreatedAt()))
                .toList();
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
