package com.applebay.backend.repository;

import com.applebay.backend.entity.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LecturerRepository
        extends JpaRepository<Lecturer, Long> {

    Optional<Lecturer> findByUser_Id(Long userId);
}
