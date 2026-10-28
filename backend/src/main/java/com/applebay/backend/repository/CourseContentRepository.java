package com.applebay.backend.repository;

import com.applebay.backend.entity.CourseContent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseContentRepository
        extends JpaRepository<CourseContent, Long> {

    List<CourseContent> findByCourse_IdOrderByIdAsc(Long courseId);

    Optional<CourseContent> findByIdAndCourse_Id(
            Long id, Long courseId);
}
