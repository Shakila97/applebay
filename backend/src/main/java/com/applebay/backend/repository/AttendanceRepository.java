package com.applebay.backend.repository;

import com.applebay.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEnrolment_IdAndAttendanceDate(
            Long enrolmentId, LocalDate attendanceDate);

    List<Attendance> findByEnrolment_Student_IdOrderByAttendanceDateDesc(
            Long studentId);

    List<Attendance> findByEnrolment_Course_IdAndAttendanceDate(
            Long courseId, LocalDate attendanceDate);
}