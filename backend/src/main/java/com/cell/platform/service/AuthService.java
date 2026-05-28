package com.cell.platform.service;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.domain.user.UserStatus;
import com.cell.platform.dto.request.LoginRequest;
import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.response.LoginResponse;
import com.cell.platform.dto.response.RegisterResponse;
import com.cell.platform.entity.StudentRosterEntity;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.infra.user.StudentRosterJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRosterJpaRepository studentRosterJpaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String username = normalizeRequired(request.username(), "학번");
        validateUniqueUsername(username);
        Role role = Role.find(request.role());
        validateRegisterRole(role);
        validateStudentId(username);
        validateStudentName(role, request.name());

        String hashedPassword = passwordEncoder.encode(request.password());
        Optional<StudentRosterEntity> roster = studentRosterJpaRepository.findByStudentId(username);
        UserStatus status = roster.isPresent() ? UserStatus.ACTIVE : UserStatus.PENDING;
        User user = User.create(username, normalizeName(request.name()), hashedPassword, role, status);
        User savedUser = userRepository.save(user);
        roster.ifPresent(item -> item.claim(savedUser.getId()));

        return status == UserStatus.ACTIVE ? RegisterResponse.active() : RegisterResponse.pending();
    }

    public LoginResponse login(LoginRequest request) {
        User user = findUserByUsername(request.username());
        validatePassword(request.password(), user.getPassword());
        validateLoginStatus(user);
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());
        return LoginResponse.of(token, user.getRole().name(), user.getUsername(), user.getName());
    }

    private void validateUniqueUsername(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("이미 존재하는 아이디입니다: " + username, ErrorCode.U000);
        }
    }

    private void validateStudentName(Role role, String name) {
        if (role == Role.STUDENT && (name == null || name.isBlank())) {
            throw new BadRequestException("학생 이름은 필수입니다.", ErrorCode.U003);
        }
    }

    private void validateRegisterRole(Role role) {
        if (role != Role.STUDENT) {
            throw new BadRequestException("학생 계정만 회원가입할 수 있습니다. 교수 계정은 관리자가 생성합니다.", ErrorCode.U003);
        }
    }

    private void validateStudentId(String username) {
        if (!username.matches("\\d{10}")) {
            throw new BadRequestException("학번은 10자리 숫자여야 합니다.", ErrorCode.U003);
        }
    }

    private String normalizeName(String name) {
        return name == null || name.isBlank() ? null : name.trim();
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException(
                        "아이디 또는 비밀번호가 일치하지 않습니다.", ErrorCode.U001));
    }

    private void validatePassword(String rawPassword, String hashedPassword) {
        if (!passwordEncoder.matches(rawPassword, hashedPassword)) {
            throw new BadRequestException("아이디 또는 비밀번호가 일치하지 않습니다.", ErrorCode.U001);
        }
    }

    private void validateLoginStatus(User user) {
        UserStatus status = user.getStatus();
        if (status == UserStatus.PENDING) {
            throw new BadRequestException("관리자 승인 대기 중인 계정입니다.", ErrorCode.U001);
        }
        if (status == UserStatus.REJECTED) {
            throw new BadRequestException("관리자가 거절한 계정입니다.", ErrorCode.U001);
        }
        if (status == UserStatus.INACTIVE) {
            throw new BadRequestException("비활성화된 계정입니다.", ErrorCode.U001);
        }
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(fieldName + "은(는) 필수입니다.", ErrorCode.G000);
        }
        return value.trim();
    }
}
