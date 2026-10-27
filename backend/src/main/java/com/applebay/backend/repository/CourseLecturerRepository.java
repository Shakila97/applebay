package com.applebay.backend.repository;

import com.applebay.backend.entity.CourseLecturer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseLecturerRepository
        extends JpaRepository<CourseLecturer, Long> {

    boolean existsByCourse_IdAndLecturer_Id(
            Long courseId,
            Long lecturerId);

    List<CourseLecturer> findByLecturer_Id(Long lecturerId);

    List<CourseLecturer> findByCourse_Id(Long courseId);
}
