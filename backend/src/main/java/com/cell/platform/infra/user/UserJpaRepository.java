package com.cell.platform.infra.user;

import com.cell.platform.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import com.cell.platform.domain.user.Role;
import com.cell.platform.domain.user.UserStatus;

public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    List<UserEntity> findAllByRole(Role role);

    List<UserEntity> findAllByRoleOrderByIdDesc(Role role);

    List<UserEntity> findAllByRoleAndStatusOrderByIdDesc(Role role, UserStatus status);

    boolean existsByUsername(String username);
}
