package com.cell.platform.infra.user;

import com.cell.platform.entity.StudentRosterEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRosterJpaRepository extends JpaRepository<StudentRosterEntity, Long> {

    Optional<StudentRosterEntity> findByStudentId(String studentId);

    boolean existsByStudentId(String studentId);

    List<StudentRosterEntity> findAllByOrderByCreatedAtDesc();
}
