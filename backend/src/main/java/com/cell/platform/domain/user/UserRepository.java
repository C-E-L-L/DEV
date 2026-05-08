package com.cell.platform.domain.user;

import java.util.Optional;

public interface UserRepository {

    User save(User user);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
