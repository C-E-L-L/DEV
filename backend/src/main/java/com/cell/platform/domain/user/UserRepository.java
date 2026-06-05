package com.cell.platform.domain.user;

import java.util.Optional;
import java.util.List;

public interface UserRepository {

    User save(User user);

    Optional<User> findByUsername(String username);

    List<User> findAll();

    List<User> findAllByRole(Role role);

    boolean existsByUsername(String username);

    void deleteByUsername(String username);
}
