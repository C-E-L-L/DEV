package com.cell.platform.service;

import com.cell.platform.config.JwtTokenProvider;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.dto.request.LoginRequest;
import com.cell.platform.dto.request.RegisterRequest;
import com.cell.platform.dto.response.LoginResponse;
import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public void register(RegisterRequest request) {
        validateUniqueUsername(request.username());
        Role role = Role.find(request.role());
        validateStudentName(role, request.name());
        String hashedPassword = passwordEncoder.encode(request.password());
        User user = User.create(request.username(), normalizeName(request.name()), hashedPassword, role);
        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        User user = findUserByUsername(request.username());
        validatePassword(request.password(), user.getPassword());
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
