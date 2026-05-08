package com.cell.platform.infra.user;

import com.cell.platform.domain.user.User;
import com.cell.platform.domain.user.UserRepository;
import com.cell.platform.entity.UserEntity;
import com.cell.platform.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserCoreRepository implements UserRepository {

    private final UserJpaRepository userJpaRepository;

    @Override
    public User save(User user) {
        UserEntity entity = Mapper.convertToUserEntity(user);
        UserEntity saved = userJpaRepository.save(entity);
        return Mapper.convertToUser(saved);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userJpaRepository.findByUsername(username).map(Mapper::convertToUser);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userJpaRepository.existsByUsername(username);
    }
}
