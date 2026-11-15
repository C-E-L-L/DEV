package com.cell.platform.infra.user;

import com.cell.platform.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import com.cell.platform.domain.user.Role;

public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from UserEntity u where u.id = :id")
    Optional<UserEntity> findForPasswordChange(@org.springframework.data.repository.query.Param("id") Long id);

    List<UserEntity> findAllByRole(Role role);

    boolean existsByUsername(String username);
}
