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
        validateUniqueUsername(request.username());
        Role role = Role.find(request.role());
        validateRegisterRole(role);
        validateStudentName(role, request.name());

        UserStatus status = resolveSignupStatus(role, request.username());
        String hashedPassword = passwordEncoder.encode(request.password());
        User user = User.create(request.username(), normalizeName(request.name()), hashedPassword, role, status);
        User savedUser = userRepository.save(user);

        if (status == UserStatus.ACTIVE) {
            studentRosterJpaRepository.findByStudentId(request.username())
                    .ifPresent(roster -> roster.claim(savedUser.getId()));
            return RegisterResponse.active();
        }
        return RegisterResponse.pending();
    }

    public LoginResponse login(LoginRequest request) {
        User user = findUserByUsername(request.username());
        validatePassword(request.password(), user.getPassword());
        validateLoginStatus(user);
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());
        return LoginResponse.of(token, user.getRole().name(), user.getUsername(), user.getName());
    }

    private UserStatus resolveSignupStatus(Role role, String username) {
        if (role != Role.STUDENT) {
            return UserStatus.ACTIVE;
        }
        Optional<StudentRosterEntity> roster = studentRosterJpaRepository.findByStudentId(username);
        return roster.isPresent() ? UserStatus.ACTIVE : UserStatus.PENDING;
    }

    private void validateLoginStatus(User user) {
        UserStatus status = user.getStatus();
        if (status == UserStatus.PENDING) {
            throw new BadRequestException("관리자 승인 대기 중인 계정입니다.", ErrorCode.U001);
        }
        if (status == UserStatus.REJECTED) {
            throw new BadRequestException("관리자가 가입을 거절한 계정입니다.", ErrorCode.U001);
        }
        if (status == UserStatus.INACTIVE) {
            throw new BadRequestException("비활성화된 계정입니다. 관리자에게 문의하세요.", ErrorCode.U001);
        }
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
        if (role == Role.ADMIN) {
            throw new BadRequestException("관리자 계정은 회원가입으로 생성할 수 없습니다.", ErrorCode.U003);
        }
        if (role == Role.EXPERT) {
            throw new BadRequestException("교수/전문가 계정은 관리자에게 문의하세요.", ErrorCode.U003);
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
}
