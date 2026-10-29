package com.applebay.backend.repository;

import com.applebay.backend.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseModuleRepository
        extends JpaRepository<CourseModule, Long> {

    List<CourseModule> findByCourse_IdOrderByPositionAscIdAsc(Long courseId);

    Optional<CourseModule> findByIdAndCourse_Id(Long id, Long courseId);
}
