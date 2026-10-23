package com.applebay.backend.repository;

import com.applebay.backend.entity.Enrolment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrolmentRepository
        extends JpaRepository<Enrolment, Long> {

    boolean existsByStudent_IdAndCourse_Id(
            Long studentId, Long courseId);

    List<Enrolment> findByCourse_Id(Long courseId);

    List<Enrolment> findByStudent_Id(Long studentId);
}