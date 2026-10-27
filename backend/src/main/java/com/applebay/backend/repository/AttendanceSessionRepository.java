package com.applebay.backend.repository;

import com.applebay.backend.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceSessionRepository
        extends JpaRepository<AttendanceSession, Long> {

    boolean existsByCourse_IdAndSessionDate(
            Long courseId,
            LocalDate sessionDate);

    List<AttendanceSession> findByCourse_Id(Long courseId);
}
